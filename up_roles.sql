CREATE TABLE IF NOT EXISTS `up_roles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int UNSIGNED DEFAULT NULL,
  `updated_by_id` int UNSIGNED DEFAULT NULL,
  `locale` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `up_roles_documents_idx` (`document_id`, `locale`, `published_at`),
  KEY `up_roles_created_by_id_fk` (`created_by_id`),
  KEY `up_roles_updated_by_id_fk` (`updated_by_id`)
);

INSERT INTO `up_roles` (`id`, `document_id`, `name`, `description`, `type`, `created_at`, `updated_at`, `published_at`, `created_by_id`, `updated_by_id`, `locale`) VALUES
(1, 'or7o85vz95yyuhtdca0em22r', 'Authenticated', 'Default role given to authenticated user.', 'authenticated', '2025-06-13 16:29:56.295000', '2025-06-13 16:29:56.295000', '2025-06-13 16:29:56.295000', NULL, NULL, NULL),
(2, 'iyr2s2xnvcwpquh3d175yhgk', 'Public', 'Default role given to unauthenticated user.', 'public', '2025-06-13 16:29:56.304000', '2025-06-13 16:29:56.304000', '2025-06-13 16:29:56.304000', NULL, NULL, NULL),
(3, 'dne5e6uy5luun25yr1rd6n3s', 'Persona Autorizada', 'Rol para personas autorizadas de los alumnos', 'persona_autorizada', '2025-06-18 18:07:59.767000', '2025-06-19 17:45:38.517000', '2025-06-18 18:07:59.771000', NULL, NULL, NULL),
(4, 'otapmjgpyq7akmy7wd9gniq8', 'Docente', 'Rol de los docentes de alumnos', 'docente', '2025-06-18 18:08:44.286000', '2025-06-19 17:46:23.538000', '2025-06-18 18:08:44.286000', NULL, NULL, NULL),
(5, 'k2oqjvfp3nwm4alxeufeph2x', 'Admin', 'Rol de admin', 'admin', '2025-06-19 17:43:43.864000', '2025-06-20 22:26:06.164000', '2025-06-19 17:43:43.866000', NULL, NULL, NULL);

ALTER TABLE `up_roles`
  ADD CONSTRAINT `up_roles_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `up_roles_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL;
