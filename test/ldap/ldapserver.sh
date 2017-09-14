#!/bin/bash

# Starts
docker rm -f domain_ldap
docker run -e LDAP_DOMAIN=domain.gs -p 389:389 --name domain_ldap -d nickstenning/slapd
sleep 20
ldapadd -h 192.168.99.100 -p 389 -x -D cn=admin,dc=domain,dc=gs -w toor -f domain.ldif
