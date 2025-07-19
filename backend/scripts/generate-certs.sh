#!/bin/bash
set -e

# Trap errors and pause
trap 'echo "\nError at line $LINENO: $BASH_COMMAND. Press ENTER to exit..."; read -r' ERR

disable_autoclose_prompt() {
  echo "$1"
  echo "Press ENTER to exit..."
  read 
}

mkdir -p tls

# Generate openssl.cnf with SANs for localhost and elasticsearch
cat > openssl.cnf <<EOF
[ req ]
default_bits       = 2048
prompt             = no
distinguished_name = req_distinguished_name
x509_extensions    = v3_req

[ req_distinguished_name ]
CN = localhost

[ v3_req ]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = localhost
DNS.2 = elasticsearch
DNS.3 = kibana
DNS.4 = logstash
IP.1  = 127.0.0.1
IP.2 = 172.18.0.2
EOF

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout tls/ca.key \
  -out tls/ca.crt \
  -days 3650 \
  -subj '//CN=MyRootCA'

openssl req -nodes -newkey rsa:2048 \
  -keyout tls/server.key \
  -out tls/server.csr \
  -config openssl.cnf

openssl x509 -req -in tls/server.csr \
  -CA tls/ca.crt -CAkey tls/ca.key -CAcreateserial \
  -out tls/server.crt \
  -days 3650 \
  -extfile openssl.cnf \
  -extensions v3_req

rm tls/server.csr tls/ca.srl openssl.cnf

echo "Certificates generated in tls/"
ls -l tls/


cat <<EOF

You can now mount these files into your Elasticsearch or Kibana containers:
  volumes:
    - ./tls/ca.crt:/usr/share/elasticsearch/config/certs/ca.crt:ro
    - ./tls/ca.key:/usr/share/elasticsearch/config/certs/ca.key:ro
    - ./tls/server.crt:/usr/share/elasticsearch/config/certs/server.crt:ro
    - ./tls/server.key:/usr/share/elasticsearch/config/certs/server.key:ro
EOF

disable_autoclose_prompt "Done."
