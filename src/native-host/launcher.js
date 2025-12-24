#!/usr/bin/env node
// tsx APIの登録
import { register } from 'tsx/esm/api';
register();
// メイン処理の動的インポート
await import('./index.ts');
