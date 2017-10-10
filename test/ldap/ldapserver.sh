#
#  Copyright 2017 Telefónica Digital España S.L.
#  
#  This file is part of UrboCore API.
#  
#  UrboCore API is free software: you can redistribute it and/or
#  modify it under the terms of the GNU Affero General Public License as
#  published by the Free Software Foundation, either version 3 of the
#  License, or (at your option) any later version.
#  
#  UrboCore API is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
#  General Public License for more details.
#  
#  You should have received a copy of the GNU Affero General Public License
#  along with UrboCore API. If not, see http://www.gnu.org/licenses/.
#  
#  For those usages not covered by this license please contact with
#  iot_support at tid dot es
#

# Starts
docker rm -f domain_ldap
docker run -e LDAP_DOMAIN=domain.gs -p 389:389 --name domain_ldap -d nickstenning/slapd
sleep 20
ldapadd -h 192.168.99.100 -p 389 -x -D cn=admin,dc=domain,dc=gs -w toor -f domain.ldif
