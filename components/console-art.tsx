'use client';

import { useEffect } from 'react';

const ART = [
  String.raw`   _____    ______    _____     __      __   ______    _____     _____    _____    _____    _____     _     _     _ `,
  String.raw`  / ____|  |  ____|  |  __ \    \ \    / /  |  ____|  |  __ \   |_   _|  |_   _|  |_   _|  |_   _|   | |   | |   | |`,
  String.raw` | (___    | |__     | |__) |    \ \  / /   | |__     | |__) |    | |      | |      | |      | |     | |   | |   | |`,
  String.raw`  \___ \   |  __|    |  _  /      \ \/ /    |  __|    |  _  /     | |      | |      | |      | |     | |   | |   | |`,
  String.raw`  ____) |  | |____   | | \ \       \  /     | |____   | | \ \    _| |_    _| |_    _| |_    _| |_    |_|   |_|   |_|`,
  String.raw` |_____/   |______|  |_|  \_\       \/      |______|  |_|  \_\  |_____|  |_____|  |_____|  |_____|  (_)   (_)   (_)`,
  '',
  ' Go and contribute!!!!!',
].join('\n');

const STYLE =
  'font-family:Consolas,Menlo,Monaco,monospace;font-size:13px;line-height:1.35;white-space:pre;';

const REPO_URL = 'https://github.com/valtterisa/haalarikone-fi';

let logged = false;

export function ConsoleArt() {
  useEffect(() => {
    if (logged) return;
    logged = true;
    console.log(`%c${ART}`, STYLE);
    console.log(REPO_URL);
  }, []);

  return null;
}
