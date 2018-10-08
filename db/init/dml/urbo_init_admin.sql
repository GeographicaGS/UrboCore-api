--
-- Copyright 2018 Telefónica Digital España S.L.
--
-- This file is part of UrboCore API.
--
-- UrboCore API is free software: you can redistribute it and/or
-- modify it under the terms of the GNU Affero General Public License as
-- published by the Free Software Foundation, either version 3 of the
-- License, or (at your option) any later version.
--
-- UrboCore API is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
-- General Public License for more details.
--
-- You should have received a copy of the GNU Affero General Public License
-- along with UrboCore API. If not, see http://www.gnu.org/licenses/.
--
-- For those usages not covered by this license please contact with
-- iot_support at tid dot es
--

-- Adding API superadmin
INSERT INTO public.users
(name,    surname,   email,               password,           superadmin)
VALUES
('admin', 'admin',   :'admin_email',      md5(:'admin_pwd'),  TRUE      );

-- Adding root to permissions tree
INSERT INTO public.users_graph
(id,  name,     parent,   read_users,   write_users)
VALUES
(1,   'root',   NULL,     '{1}',        '{1}');
