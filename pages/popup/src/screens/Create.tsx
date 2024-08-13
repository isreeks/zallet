import React, { useEffect, useState } from 'react';
import { useNavigate, redirect } from 'react-router-dom';
import { Button } from '@extension/ui';
import { useStorageSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { unlockWallet } from '@extension/storage/lib/session';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import { storeKey } from '@extension/storage/lib/keyStore';

interface Data {
  password: string;
  confirmedPassword: string;
  mnemonicWords: string[];
  seed: any;
}
const Create = () => {
  const theme = useStorageSuspense(exampleThemeStorage);
  const isLight = theme === 'light';
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [data, setData] = useState<Data>({
    password: '',
    confirmedPassword: '',
    mnemonicWords: [],
    seed: '',
  });

  const generateMnemonicWords = async () => {
    const mnemonic = await generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic);
    return { mnemonicWords: mnemonic ? mnemonic.split(' ') : [], seed };
  };

  async function PasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // unlockWallet('myKeyId', data.password);
    generateMnemonicWords().then(({ mnemonicWords, seed }) => {
      setData({ ...data, mnemonicWords, seed });
    });
    nextStep();
  }

  const createWallet = async () => {
    const path = `m/44'/501'/0'/0'`;
    const derivedSeed = derivePath(path, data.seed.toString('hex')).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const secretKeyString = Array.from(secret)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    await storeKey('myKeyId', { keyData: secretKeyString }, data.password);
    await unlockWallet('myKeyId', data.password);
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(data.mnemonicWords.toString().replaceAll(',', ' '))
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-black  flex flex-col h-full justify-end ">
            <div className="flex flex-col h-full justify-end">
              <Button
                onClick={() => {
                  nextStep();
                }}
                className="text-lg rounded-md font-semibold">
                Create a new wallet
              </Button>
              <Button className="text-lg rounded-md font-semibold">Import existing wallet</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-black  flex flex-col h-full justify-center ">
            <div>
              <form className="flex flex-col gap-1" action="" onSubmit={e => PasswordSubmit(e)}>
                <input
                  onChange={e => setData({ ...data, password: e.target.value })}
                  value={data.password}
                  className="border-2 border-gray-300 rounded-md p-2 "
                  type="password"
                  placeholder="Password"
                />
                <input
                  onChange={e => setData({ ...data, confirmedPassword: e.target.value })}
                  value={data.confirmedPassword}
                  className="border-2 border-gray-300 rounded-md p-2 "
                  type="password"
                  placeholder="Password"
                />
                <Button type="submit" className="text-lg rounded-md font-semibold">
                  Next
                </Button>
                {/* {error && (
                  <div className="px-2 py-1 bg-red-100 mt-3 rounded-md">
                    <p className="text-red-500">{error}</p>
                  </div>
                )} */}
              </form>
            </div>
          </div>
        );
      case 3:
        return (
          <div className=" p-1 gap-3 flex flex-col h-full  ">
            <h2 className="text-2xl">Secret Keyphrase</h2>
            <div className="grid grid-cols-3 gap-2">
              {data.mnemonicWords.map((word, index) => (
                <div key={index} className="flex px-2 py-1 border gap-1 rounded-sm    bg-slate-200">
                  <p className=" text-sm">{index + 1}</p>
                  <p className="text-sm">{word}</p>
                </div>
              ))}
            </div>

            <Button onClick={copyToClipboard} className=" rounded-md font-semibold">
              Copy to clipboard
            </Button>
            <Button
              onClick={() => {
                createWallet();
                navigate('/home');
              }}
              className=" rounded-md font-semibold">
              Next
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-black bg-white p-4">
            <h2 className="text-2xl">Completed</h2>
            <p>You've completed the wizard!</p>
          </div>
        );
    }
  };

  return (
    <div className={`p-4 flex flex-col     App gap-4 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      {renderStep()}
      <div className="mt-4 flex justify-between">
        {step > 1 && (
          <Button onClick={prevStep} className="bg-gray-300 text-black py-2 px-4 rounded">
            Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default Create;
