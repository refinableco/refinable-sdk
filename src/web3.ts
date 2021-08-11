import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';

const POLLING_INTERVAL = 12000;

export const getProvider = (provider: ExternalProvider | JsonRpcFetchFunc) => {
  // the "any" prevents https://github.com/NoahZinsmeister/web3-react/issues/127
  return new ethers.providers.Web3Provider(provider, 'any');
};

export function web3Callback(resolve: (arg: any) => void, reject: (arg: Error) => void) {
  return (error: Error, value: any) => {
    if (error) {
      reject(error);
    } else {
      resolve(value);
    }
  };
}

export function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc): unknown {
  const library = new Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return provider;
}
