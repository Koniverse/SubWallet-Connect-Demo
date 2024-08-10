import './App.css'

import Onboard, { WalletState } from "@subwallet-connect/core";
import injectedModule from "@subwallet-connect/injected-wallets";
import subwalletModule from '@subwallet-connect/subwallet';
import subwalletPolkadotModule from '@subwallet-connect/subwallet-polkadot';
import type {
  Chain
} from "@subwallet-connect/common";
import { useCallback, useState } from "react";
import {ChainInfoMap} from "@subwallet/chain-list";
import {ApiPromise, WsProvider} from "@polkadot/api";
import { Signer } from '@polkadot/api/types';
import {ThemingMap} from "@subwallet-connect/core/dist/types";

// Use @subwallet/chain-list
function getPolkadotNetworkInfo (chainSlug: string): Chain {
  const chainInfo = ChainInfoMap[chainSlug];
  const info = chainInfo?.substrateInfo;

  if (!info) {
    throw new Error(`Chain ${chainSlug} is not supported`);
  }

  console.log(Object.values(chainInfo.providers));

  return {
    namespace: 'substrate',
    id: info.genesisHash,
    label: chainInfo.name,
    token: info.symbol,
    decimal: info.decimals,
    rpcUrl: Object.values(chainInfo.providers)[0],
  }
}

function getEvmNetworkInfo (chainSlug: string): Chain {
  const chainInfo = ChainInfoMap[chainSlug];
  const info = chainInfo?.evmInfo;

  if (!info) {
    throw new Error(`Chain ${chainSlug} is not supported`);
  }

  return {
    id: info.evmChainId.toString(16),
    label: chainInfo.name,
    token: info.symbol,
    decimal: info.decimals,
    rpcUrl: Object.values(chainInfo.providers)[0],
  }
}

const customTheme = {
    '--w3o-background-color': '#0C0C0C',
    '--w3o-foreground-color': '#0C0C0C',
    '--w3o-text-color': 'rgba(255, 255, 255, 0.8)',
    '--w3o-border-color': '#212121',
    '--w3o-action-color': '#252525',
    '--w3o-border-radius': '16px',
    '--w3o-font-family': 'inherit',
    '--w3o-background-color-item': '#1A1A1A'
  } as ThemingMap;


// Initialize the provider
const injected = injectedModule();
const subWallet = subwalletModule();
const subWalletP = subwalletPolkadotModule();
// const polkadotJsWallet = polkadotJsModule();

console.log('injected', getPolkadotNetworkInfo('polkadot'));
const polkadotInfo = getPolkadotNetworkInfo('polkadot');
const kusamaInfo = getPolkadotNetworkInfo('kusama');

const onboard = Onboard({
  wallets: [injected, subWallet, subWalletP],
  theme: customTheme,
  chains: [
    getEvmNetworkInfo('ethereum'),
  ],
  chainsPolkadot: [
    polkadotInfo,
    kusamaInfo,
  ],
});


// Init SubConnect
// Init SubConnect with more connectors
// Customize Theme
// Action, sign message, create transaction
// Implement with the hooks

// Update full react-demo
// Use from the demo transaction
const polkadotApi = new ApiPromise({
  provider: new WsProvider(polkadotInfo.rpcUrl)
});


function App() {
  const [wallets, setWallets] = useState<WalletState[]>([]);

  const connect = useCallback(() => {
    onboard
      .connectWallet()
      .then((walletList) => {
        setWallets(walletList);
      })
      .catch(console.error);
  }, []);

  // Implement sign message
  const createSignature = useCallback((wallet: WalletState) => {
    if (wallet.type === 'evm') {
      wallet.provider.request({
        method: 'personal_sign',
        params: ['Some content to sign', wallet.accounts[0].address]
      }).then((rs)  => {
        alert(`Signature: "${rs}"`);
      }).catch(console.error);
    } else {
      if (wallet?.signer) {

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        wallet.signer.signRaw({
          type: 'bytes',
          address: wallet.accounts[0].address,
          data: 'Some content to sign'
        }).then((rs)  => {
          alert(`Signature: "${rs.signature}"`);
        }).catch(console.error);
      }
    }
  }, []);

  // Create simple transaction
  const createTransaction = useCallback((wallet: WalletState) => {
    const address = wallet.accounts[0].address;
    const signer = wallet.signer as Signer;

    if (!signer) {
      return;
    }

    polkadotApi.isReady.then((api) => {
      const extrinsics = api.tx.balances.transferKeepAlive('5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo', 10000000)
      extrinsics.signAsync(address, { signer }).then((tx) => {
        alert('Transaction created')
        console.log(tx);
      })
    })
  }, []);

  return (
    <>
      <h1>Vite + React + SubConnect</h1>
      <div className="card">
        <button onClick={connect}>
          Connect Wallet
        </button>
      </div>
      {wallets.length > 0 && (<div className="card">
        <h3>Connected Wallet</h3>
        {wallets.map((w) => {
          return (
            <div className={'wallet-block'} key={w.label}>
              <div className="icon">
                <div dangerouslySetInnerHTML={{__html: w.icon}}/>
              </div>
              <div className="content">
                <h4>{w.label}</h4>

                <ul className={'address-list'}>
                  {w.accounts.map((acc) => {
                    return (
                      <li key={acc.address}>
                        <div className="address">
                          {acc.address}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <button onClick={() => {
                  createSignature(w)
                }}>
                  Create signature
                </button>

                <button onClick={() => {
                  createTransaction(w)
                }}>
                  Create transaction
                </button>
              </div>
            </div>
          );
        })}
      </div>)}
    </>
  )
}

export default App
