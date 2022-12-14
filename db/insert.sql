INSERT INTO "public".organization (id, BIN, name_org, password_kofd)
VALUES
(1, '800727301256', 'ИП Incore', 'Aw31415926!'),
(2, '790125400336', 'ИП Solutions (CIPO)', 'Aw31415926!');

INSERT INTO "public".kassa (id, snumber, znumber, knumber, name_kassa, id_organization)
VALUES
(1, '010102360873','SWK00426370','34012', 'Incore-Евразия-3', 1),
(2, '010102355028','SWK00426032','33812', 'Incore-Мухамедханова', 1),
(3, '010101724195', 'SWK00402028', '18832', 'Solutions-Евразия-3', 2),
(4, '010101367960', 'SWK00381026', '8247', 'Solutions-Мухамедханова',2);

 