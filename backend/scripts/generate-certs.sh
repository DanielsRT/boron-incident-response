#!/usr/bin/env bash
# scripts/generate-selfsigned-cert.sh
# Generates a self-signed TLS certificate and private key in the current directory.
# The cert and key are output to ./tls/{cert.pem,key.pem}

set -euo pipefail

# Trap errors and pause
trap 'echo "\nError at line $LINENO: $BASH_COMMAND. Press ENTER to exit..."; read -r' ERR

disable_autoclose_prompt() {
  echo "$1"
  echo "Press ENTER to exit..."
  read -r
}

# Output directory for cert and key
OUTPUT_DIR="tls"
mkdir -p "$OUTPUT_DIR"

# Determine Common Name (CN) for certificate
COMMON_NAME=${1:-"localhost"}

# Validity period in days (optional second argument)
DAYS_VALID=${2:-3650}
KEY_FILE="$OUTPUT_DIR/key.pem"
CERT_FILE="$OUTPUT_DIR/cert.pem"

echo "Generating self-signed certificate for CN=$COMMON_NAME, valid for $DAYS_VALID days..."

# Generate certificate and key
# Use double-slash for -subj to avoid MSYS interpreting it as a filesystem path
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -days "$DAYS_VALID" \
  -subj "//CN=$COMMON_NAME"

cat <<EOF

Self-signed certificate generation complete:
  Private key: $KEY_FILE
  Certificate: $CERT_FILE

You can now mount these files into your Elasticsearch or Kibana containers:
  volumes:
    - ./tls/cert.pem:/usr/share/elasticsearch/config/certs/cert.pem:ro
    - ./tls/key.pem:/usr/share/elasticsearch/config/certs/key.pem:ro
EOF

disable_autoclose_prompt "Done."
