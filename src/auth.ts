import * as nacl from 'tweetnacl';
import { BackpackCredentials, BackpackRequestConfig } from './types';

export class BackpackAuth {
  private credentials: BackpackCredentials;

  constructor(credentials: BackpackCredentials) {
    this.credentials = credentials;
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    return Buffer.from(binaryString, 'binary').toString('base64');
  }

  signRequest(config: BackpackRequestConfig, timestamp: number, window: number): Record<string, string> {
    const { method, path, params, body } = config;
    
    const sortedParams: string[] = [];
    if (params && Object.keys(params).length > 0) {
      Object.keys(params)
        .sort()
        .forEach(key => {
          const value = params[key];
          if (value !== undefined && value !== null) {
            sortedParams.push(`${key}=${encodeURIComponent(value.toString())}`);
          }
        });
    }

    const queryString = sortedParams.join('&');
    const fullPath = queryString ? `${path}?${queryString}` : path;
    
    let instructionType = '';
    if (path === '/wapi/v1/history/fills') {
      instructionType = 'fillHistoryQueryAll';
    } else if (path === '/wapi/v1/history/orders') {
      instructionType = 'orderHistoryQueryAll';
    } else if (path === '/wapi/v1/history/fundingPayments') {
      instructionType = 'fundingPayments';
    } else if (path === '/wapi/v1/history/settlement') {
      instructionType = 'settlement';
    } else {
      instructionType = `${method.toLowerCase()}${path.replace(/\//g, '')}`;
    }
    
    const instruction = `instruction=${instructionType}${queryString ? `&${queryString}` : ''}&timestamp=${timestamp}&window=${window}`;

    const privateKeyBytes = Buffer.from(this.credentials.privateKey, 'base64');
    
    let secretKey: Uint8Array;
    if (privateKeyBytes.length === 32) {
      const publicKey = nacl.sign.keyPair.fromSeed(privateKeyBytes).publicKey;
      secretKey = new Uint8Array(64);
      secretKey.set(privateKeyBytes);
      secretKey.set(publicKey, 32);
    } else if (privateKeyBytes.length === 64) {
      secretKey = privateKeyBytes;
    } else {
      throw new Error(`Invalid private key length: expected 32 or 64 bytes, got ${privateKeyBytes.length}`);
    }

    const messageBytes = new TextEncoder().encode(instruction);
    const signature = nacl.sign.detached(messageBytes, secretKey);

    return {
      'X-API-Key': this.credentials.apiKey,
      'X-Timestamp': timestamp.toString(),
      'X-Window': window.toString(),
      'X-Signature': Buffer.from(signature).toString('base64'),
      'Content-Type': 'application/json',
    };
  }
}