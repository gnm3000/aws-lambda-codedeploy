#!/usr/bin/env bash

# Deploy the SAM application and print the API Gateway URL when finished.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v sam >/dev/null 2>&1; then
  echo "sam CLI is required but was not found in PATH." >&2
  exit 1
fi

STACK_NAME="${STACK_NAME:-}"

if [ -z "${STACK_NAME}" ] && [ -f "${PROJECT_ROOT}/samconfig.toml" ]; then
  STACK_NAME="$(awk -F'\"' '/stack_name/ {print $2; exit}' "${PROJECT_ROOT}/samconfig.toml" || true)"
fi

STACK_NAME="${STACK_NAME:-sam-lambda-ts-app}"

REGION="${REGION:-us-east-1}"
CURRENT_REGION="$(aws configure get region)"
echo "Deploying to region: ${CURRENT_REGION:-<none>}"
echo "Using stack name: ${STACK_NAME}"
echo "Using SAM region: ${REGION}"

pushd "${PROJECT_ROOT}" >/dev/null
sam deploy --region "${REGION}" --stack-name "${STACK_NAME}" "$@"
popd >/dev/null

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not available; skipping API URL lookup." >&2
  exit 0
fi

API_URL="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='HelloWorldApi'].OutputValue" \
  --output text 2>/dev/null || echo "")"

if [ -z "${API_URL}" ] || [ "${API_URL}" = "None" ]; then
  echo "API URL output not found for stack '${STACK_NAME}'." >&2
  exit 0
fi

echo
echo "API endpoint:"
echo "  ${API_URL}"
