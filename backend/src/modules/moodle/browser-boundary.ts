// No production browser automation is enabled. A real Playwright driver needs
// institutional permission and a verified, secure student session establishment flow.
import type {Config} from '../../config.js';
import {ApiError} from '../../errors.js';
import {encryptToken,decryptToken} from './security.js';
import type {MoodleAdapter,MoodleSnapshot} from './adapter.js';
const institution='https://moodle.alaqsa.edu.ps';
export interface BrowserState {cookies:{name:string;value:string;domain:string;path:string;expires:number;httpOnly:boolean;secure:boolean;sameSite:'Strict'|'Lax'|'None'}[];origins:{origin:string;localStorage:{name:string;value:string}[]}[]}
export function sealBrowserState(state:BrowserState,key:string,user:string){
 if(state.cookies.length>100||state.cookies.some(x=>x.domain.replace(/^\./,'')!=='moodle.alaqsa.edu.ps'||!x.secure)||state.origins.some(x=>x.origin!==institution))throw new ApiError(400,'MOODLE_BROWSER_STATE_REJECTED');
 return encryptToken(JSON.stringify(state),key,user,institution+':browser-state');
}
export function openBrowserState(cipher:string,key:string,user:string):BrowserState{return JSON.parse(decryptToken(cipher,key,user,institution+':browser-state'));}
export interface VerifiedFixturePage {url:string;authentication:'AUTHORIZED'|'EXPIRED';snapshot:MoodleSnapshot}
export function fixtureBrowserAdapter(c:Config,user:string,openIsolatedPage:(user:string,signal:AbortSignal)=>Promise<VerifiedFixturePage>):MoodleAdapter {
 if(c.NODE_ENV!=='test')throw new ApiError(503,'MOODLE_BROWSER_NOT_VERIFIED');
 return {async fetchSnapshot(_credential,_now,signal){const page=await openIsolatedPage(user,signal),url=new URL(page.url);if(url.origin!==institution)throw new ApiError(502,'MOODLE_BROWSER_ORIGIN_REJECTED');if(page.authentication==='EXPIRED'||url.pathname.startsWith('/login/'))throw new ApiError(502,'MOODLE_AUTHENTICATION_FAILED');return structuredClone(page.snapshot);}};
}
