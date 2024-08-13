import '@src/Popup.css';
import { useStorageSuspense, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { storeKey, retrieveKey, encryptData, decryptData } from '@extension/storage/lib/keyStore';
import { getSession } from '@extension/storage/lib/session';
import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import {
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  clusterApiUrl,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

const Popup = () => {
  const theme = useStorageSuspense(exampleThemeStorage);
  const isLight = theme === 'light';
  const [balence, setBalance] = useState<number>(0);
  const [publicKey, setPublicKey] = useState<string>('');
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';

  useEffect(() => {
    (async () => {
      const retrievedKey = await getSession('myKeyId');

      if (retrieveKey === null) {
        return;
      }
      // @ts-ignore
      const decryptedSecretKey = Uint8Array.from(retrievedKey.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      const publicKey = Keypair.fromSecretKey(decryptedSecretKey).publicKey.toBase58();

      console.log(publicKey);

      setPublicKey(publicKey);
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

      let wallet = new PublicKey(publicKey);
      setBalance((await connection.getBalance(wallet)) / LAMPORTS_PER_SOL);
    })();
  }, []);

  async function sendSOL() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const retrievedKey = await retrieveKey('myKeyId', 'encryptionKeyForDemo');

    // @ts-ignore
    const decryptedSecretKey = Uint8Array.from(retrievedKey.keyData.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const publicKey = Keypair.fromSecretKey(decryptedSecretKey).publicKey.toBase58();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(publicKey),
        toPubkey: new PublicKey('C8C4tKQA8zxzTUMSvXgrABxiK2McMi1tA692BaGaSZ2E'),
        lamports: 1000000000,
      }),
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      Keypair.fromSecretKey(decryptedSecretKey),
    ]);
  }

  function trunc(num: number, dec: number) {
    const pow = 10 ** dec;
    return Math.trunc(num * pow) / pow;
  }

  return (
    <div className={`App h-screen ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <h2 className="text-2xl font-bold">{trunc(balence, 2)} SOL</h2>
        {publicKey}
        {/* <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={injectContentScript}>
          Click to inject Content Script
        </button> */}
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={sendSOL}>
          Send SOL
        </button>
        <ToggleButton>Toggle theme</ToggleButton>
      </header>
      <div></div>
    </div>
  );
};

export const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorageSuspense(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
