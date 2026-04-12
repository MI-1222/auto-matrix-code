#!/bin/bash
# Auto Matrix Code用ラッパースクリプト

# デバッグログ: 実行確認用ログファイルの指定
LOG_FILE="/tmp/amc_native_host.log"

# stderr (FD 2) をログファイルへリダイレクト。
# stdout (FD 1) はChromeとの通信用のため維持。
exec 2>> "$LOG_FILE"

echo "========================================" >&2
echo "Starting Native Host wrapper at $(date)" >&2
echo "User: $(whoami)" >&2
echo "Directory: $(pwd)" >&2

# コンパイル済みhost.cjsへの絶対パス解決
# ラッパーがsrc/native-host/、host.cjsがdist/にあると仮定
DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_SCRIPT="$DIR/../../dist/host.cjs"
PROJECT_ROOT="$DIR/../../"

# デフォルトのNode.jsパス
NODE_PATH=$(which node)

# .env ファイルが存在すれば読み込む
if [ -f "$PROJECT_ROOT/.env" ]; then
  # export されていない変数もプロセス内で使えるように読み込む
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

echo "Node Path: $NODE_PATH" >&2
echo "Host Script: $HOST_SCRIPT" >&2

if [ ! -x "$NODE_PATH" ]; then
  echo "CRITICAL ERROR: Node実行可能ファイルが見つかりません: $NODE_PATH" >&2
  exit 1
fi

if [ ! -f "$HOST_SCRIPT" ]; then
  echo "CRITICAL ERROR: ホストスクリプトが見つかりません: $HOST_SCRIPT" >&2
  exit 1
fi

# Nodeプロセスの実行
# Native Messagingはstdin/stdoutを使用するため追加引数は不要
exec "$NODE_PATH" "$HOST_SCRIPT"
