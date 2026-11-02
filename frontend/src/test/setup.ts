import {afterEach} from 'vitest';
import {cleanup} from '@testing-library/react';
// jsdom has no native dialog implementation; browser QA verifies real dialogs.
Object.defineProperties(HTMLDialogElement.prototype,{showModal:{configurable:true,value:function(this:HTMLDialogElement){this.open=true;}},close:{configurable:true,value:function(this:HTMLDialogElement){this.open=false;}}});
afterEach(cleanup);
