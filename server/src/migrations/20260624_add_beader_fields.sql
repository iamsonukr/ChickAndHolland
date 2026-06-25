ALTER TABLE `products`
  ADD COLUMN `beader` varchar(255) NULL AFTER `beading_color`;

ALTER TABLE `orderStyles`
  ADD COLUMN `beader` varchar(255) NULL AFTER `beading_color`;
