-- Insert 100 sample parts for fire sprinkler systems (50 as best sellers)

-- Sprinklers
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('SPK-1001', '1/2"', 'Sprinkler 1/2" - Model 1001', 'Sprinkler', 8.00, 9.00, 10.00, 100, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1002', '3/4"', 'Sprinkler 3/4" - Model 1002', 'Sprinkler', 12.00, 13.50, 15.00, 80, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1003', '1"', 'Sprinkler 1" - Model 1003', 'Sprinkler', 16.00, 18.00, 20.00, 60, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1004', '1-1/4"', 'Sprinkler 1-1/4" - Model 1004', 'Sprinkler', 20.00, 22.50, 25.00, 40, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1005', '1-1/2"', 'Sprinkler 1-1/2" - Model 1005', 'Sprinkler', 24.00, 27.00, 30.00, 50, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1006', '2"', 'Sprinkler 2" - Model 1006', 'Sprinkler', 28.00, 31.50, 35.00, 45, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1007', '2-1/2"', 'Sprinkler 2-1/2" - Model 1007', 'Sprinkler', 32.00, 36.00, 40.00, 30, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1008', '3"', 'Sprinkler 3" - Model 1008', 'Sprinkler', 36.00, 40.50, 45.00, 25, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1009', '4"', 'Sprinkler 4" - Model 1009', 'Sprinkler', 40.00, 45.00, 50.00, 20, true, '/assets/parts/template-sprinkler.svg'),
('SPK-1010', '1/2"', 'Sprinkler 1/2" - Model 1010', 'Sprinkler', 8.00, 9.00, 10.00, 95, false, '/assets/parts/template-sprinkler.svg');

-- Valves
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('VLV-1011', '1/2"', 'Valve 1/2" - Model 1011', 'Valve', 16.00, 18.00, 20.00, 75, true, '/assets/parts/template-valve.svg'),
('VLV-1012', '3/4"', 'Valve 3/4" - Model 1012', 'Valve', 20.00, 22.50, 25.00, 70, true, '/assets/parts/template-valve.svg'),
('VLV-1013', '1"', 'Valve 1" - Model 1013', 'Valve', 24.00, 27.00, 30.00, 65, true, '/assets/parts/template-valve.svg'),
('VLV-1014', '1-1/4"', 'Valve 1-1/4" - Model 1014', 'Valve', 28.00, 31.50, 35.00, 60, true, '/assets/parts/template-valve.svg'),
('VLV-1015', '1-1/2"', 'Valve 1-1/2" - Model 1015', 'Valve', 32.00, 36.00, 40.00, 55, true, '/assets/parts/template-valve.svg'),
('VLV-1016', '2"', 'Valve 2" - Model 1016', 'Valve', 36.00, 40.50, 45.00, 50, true, '/assets/parts/template-valve.svg'),
('VLV-1017', '2-1/2"', 'Valve 2-1/2" - Model 1017', 'Valve', 40.00, 45.00, 50.00, 45, true, '/assets/parts/template-valve.svg'),
('VLV-1018', '3"', 'Valve 3" - Model 1018', 'Valve', 48.00, 54.00, 60.00, 40, true, '/assets/parts/template-valve.svg'),
('VLV-1019', '4"', 'Valve 4" - Model 1019', 'Valve', 64.00, 72.00, 80.00, 35, true, '/assets/parts/template-valve.svg'),
('VLV-1020', '1/2"', 'Valve 1/2" - Model 1020', 'Valve', 16.00, 18.00, 20.00, 70, false, '/assets/parts/template-valve.svg');

-- Fittings
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('FIT-1021', '1/2"', 'Fitting 1/2" - Model 1021', 'Fitting', 4.00, 4.50, 5.00, 200, true, '/assets/parts/template-fitting.svg'),
('FIT-1022', '3/4"', 'Fitting 3/4" - Model 1022', 'Fitting', 5.60, 6.30, 7.00, 180, true, '/assets/parts/template-fitting.svg'),
('FIT-1023', '1"', 'Fitting 1" - Model 1023', 'Fitting', 7.20, 8.10, 9.00, 160, true, '/assets/parts/template-fitting.svg'),
('FIT-1024', '1-1/4"', 'Fitting 1-1/4" - Model 1024', 'Fitting', 8.80, 9.90, 11.00, 140, true, '/assets/parts/template-fitting.svg'),
('FIT-1025', '1-1/2"', 'Fitting 1-1/2" - Model 1025', 'Fitting', 10.40, 11.70, 13.00, 120, true, '/assets/parts/template-fitting.svg'),
('FIT-1026', '2"', 'Fitting 2" - Model 1026', 'Fitting', 12.00, 13.50, 15.00, 100, true, '/assets/parts/template-fitting.svg'),
('FIT-1027', '2-1/2"', 'Fitting 2-1/2" - Model 1027', 'Fitting', 14.40, 16.20, 18.00, 90, true, '/assets/parts/template-fitting.svg'),
('FIT-1028', '3"', 'Fitting 3" - Model 1028', 'Fitting', 16.80, 18.90, 21.00, 80, true, '/assets/parts/template-fitting.svg'),
('FIT-1029', '4"', 'Fitting 4" - Model 1029', 'Fitting', 19.20, 21.60, 24.00, 70, true, '/assets/parts/template-fitting.svg'),
('FIT-1030', '1/2"', 'Fitting 1/2" - Model 1030', 'Fitting', 4.00, 4.50, 5.00, 190, false, '/assets/parts/template-fitting.svg');

-- Monitors
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('MON-1031', '1"', 'Monitor 1" - Model 1031', 'Monitor', 80.00, 90.00, 100.00, 25, true, '/assets/parts/template-monitor.svg'),
('MON-1032', '1-1/4"', 'Monitor 1-1/4" - Model 1032', 'Monitor', 104.00, 117.00, 130.00, 20, true, '/assets/parts/template-monitor.svg'),
('MON-1033', '1-1/2"', 'Monitor 1-1/2" - Model 1033', 'Monitor', 128.00, 144.00, 160.00, 15, true, '/assets/parts/template-monitor.svg'),
('MON-1034', '2"', 'Monitor 2" - Model 1034', 'Monitor', 152.00, 171.00, 190.00, 20, true, '/assets/parts/template-monitor.svg'),
('MON-1035', '2-1/2"', 'Monitor 2-1/2" - Model 1035', 'Monitor', 176.00, 198.00, 220.00, 18, true, '/assets/parts/template-monitor.svg'),
('MON-1036', '3"', 'Monitor 3" - Model 1036', 'Monitor', 200.00, 225.00, 250.00, 15, true, '/assets/parts/template-monitor.svg'),
('MON-1037', '4"', 'Monitor 4" - Model 1037', 'Monitor', 240.00, 270.00, 300.00, 10, true, '/assets/parts/template-monitor.svg'),
('MON-1038', '2"', 'Monitor 2" - Model 1038', 'Monitor', 152.00, 171.00, 190.00, 12, false, '/assets/parts/template-monitor.svg'),
('MON-1039', '3"', 'Monitor 3" - Model 1039', 'Monitor', 200.00, 225.00, 250.00, 8, false, '/assets/parts/template-monitor.svg'),
('MON-1040', '4"', 'Monitor 4" - Model 1040', 'Monitor', 240.00, 270.00, 300.00, 5, false, '/assets/parts/template-monitor.svg');

-- Alarms
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('ALM-1041', 'N/A', 'Alarm N/A - Model 1041', 'Alarm', 48.00, 54.00, 60.00, 30, true, '/assets/parts/template-alarm.svg'),
('ALM-1042', 'N/A', 'Alarm N/A - Model 1042', 'Alarm', 56.00, 63.00, 70.00, 25, true, '/assets/parts/template-alarm.svg'),
('ALM-1043', 'N/A', 'Alarm N/A - Model 1043', 'Alarm', 64.00, 72.00, 80.00, 20, true, '/assets/parts/template-alarm.svg'),
('ALM-1044', 'N/A', 'Alarm N/A - Model 1044', 'Alarm', 72.00, 81.00, 90.00, 18, true, '/assets/parts/template-alarm.svg'),
('ALM-1045', 'N/A', 'Alarm N/A - Model 1045', 'Alarm', 80.00, 90.00, 100.00, 15, true, '/assets/parts/template-alarm.svg'),
('ALM-1046', 'N/A', 'Alarm N/A - Model 1046', 'Alarm', 88.00, 99.00, 110.00, 12, false, '/assets/parts/template-alarm.svg'),
('ALM-1047', 'N/A', 'Alarm N/A - Model 1047', 'Alarm', 96.00, 108.00, 120.00, 10, false, '/assets/parts/template-alarm.svg'),
('ALM-1048', 'N/A', 'Alarm N/A - Model 1048', 'Alarm', 104.00, 117.00, 130.00, 8, false, '/assets/parts/template-alarm.svg'),
('ALM-1049', 'N/A', 'Alarm N/A - Model 1049', 'Alarm', 112.00, 126.00, 140.00, 7, false, '/assets/parts/template-alarm.svg'),
('ALM-1050', 'N/A', 'Alarm N/A - Model 1050', 'Alarm', 120.00, 135.00, 150.00, 5, false, '/assets/parts/template-alarm.svg');

-- Connections
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('CON-1051', '1/2"', 'Connection 1/2" - Model 1051', 'Connection', 12.00, 13.50, 15.00, 60, true, '/assets/parts/template-connection.svg'),
('CON-1052', '3/4"', 'Connection 3/4" - Model 1052', 'Connection', 16.00, 18.00, 20.00, 55, true, '/assets/parts/template-connection.svg'),
('CON-1053', '1"', 'Connection 1" - Model 1053', 'Connection', 20.00, 22.50, 25.00, 50, true, '/assets/parts/template-connection.svg'),
('CON-1054', '1-1/4"', 'Connection 1-1/4" - Model 1054', 'Connection', 24.00, 27.00, 30.00, 45, true, '/assets/parts/template-connection.svg'),
('CON-1055', '1-1/2"', 'Connection 1-1/2" - Model 1055', 'Connection', 28.00, 31.50, 35.00, 40, true, '/assets/parts/template-connection.svg'),
('CON-1056', '2"', 'Connection 2" - Model 1056', 'Connection', 32.00, 36.00, 40.00, 35, false, '/assets/parts/template-connection.svg'),
('CON-1057', '2-1/2"', 'Connection 2-1/2" - Model 1057', 'Connection', 36.00, 40.50, 45.00, 30, false, '/assets/parts/template-connection.svg'),
('CON-1058', '3"', 'Connection 3" - Model 1058', 'Connection', 40.00, 45.00, 50.00, 25, false, '/assets/parts/template-connection.svg'),
('CON-1059', '4"', 'Connection 4" - Model 1059', 'Connection', 48.00, 54.00, 60.00, 20, false, '/assets/parts/template-connection.svg'),
('CON-1060', '1/2"', 'Connection 1/2" - Model 1060', 'Connection', 12.00, 13.50, 15.00, 58, false, '/assets/parts/template-connection.svg');

-- Pipes
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('PIP-1061', '1/2"', 'Pipe 1/2" - Model 1061', 'Pipe', 4.80, 5.40, 6.00, 150, true, '/assets/parts/template-pipe.svg'),
('PIP-1062', '3/4"', 'Pipe 3/4" - Model 1062', 'Pipe', 6.40, 7.20, 8.00, 140, true, '/assets/parts/template-pipe.svg'),
('PIP-1063', '1"', 'Pipe 1" - Model 1063', 'Pipe', 8.00, 9.00, 10.00, 130, true, '/assets/parts/template-pipe.svg'),
('PIP-1064', '1-1/4"', 'Pipe 1-1/4" - Model 1064', 'Pipe', 10.40, 11.70, 13.00, 120, true, '/assets/parts/template-pipe.svg'),
('PIP-1065', '1-1/2"', 'Pipe 1-1/2" - Model 1065', 'Pipe', 12.80, 14.40, 16.00, 110, true, '/assets/parts/template-pipe.svg'),
('PIP-1066', '2"', 'Pipe 2" - Model 1066', 'Pipe', 16.00, 18.00, 20.00, 100, false, '/assets/parts/template-pipe.svg'),
('PIP-1067', '2-1/2"', 'Pipe 2-1/2" - Model 1067', 'Pipe', 20.00, 22.50, 25.00, 90, false, '/assets/parts/template-pipe.svg'),
('PIP-1068', '3"', 'Pipe 3" - Model 1068', 'Pipe', 24.00, 27.00, 30.00, 80, false, '/assets/parts/template-pipe.svg'),
('PIP-1069', '4"', 'Pipe 4" - Model 1069', 'Pipe', 32.00, 36.00, 40.00, 70, false, '/assets/parts/template-pipe.svg'),
('PIP-1070', '6"', 'Pipe 6" - Model 1070', 'Pipe', 48.00, 54.00, 60.00, 60, false, '/assets/parts/template-pipe.svg');

-- Hoses
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('HOS-1071', '1/2"', 'Hose 1/2" - Model 1071', 'Hose', 24.00, 27.00, 30.00, 50, true, '/assets/parts/template-hose.svg'),
('HOS-1072', '3/4"', 'Hose 3/4" - Model 1072', 'Hose', 28.00, 31.50, 35.00, 45, true, '/assets/parts/template-hose.svg'),
('HOS-1073', '1"', 'Hose 1" - Model 1073', 'Hose', 32.00, 36.00, 40.00, 40, true, '/assets/parts/template-hose.svg'),
('HOS-1074', '1-1/4"', 'Hose 1-1/4" - Model 1074', 'Hose', 36.00, 40.50, 45.00, 35, true, '/assets/parts/template-hose.svg'),
('HOS-1075', '1-1/2"', 'Hose 1-1/2" - Model 1075', 'Hose', 40.00, 45.00, 50.00, 30, true, '/assets/parts/template-hose.svg'),
('HOS-1076', '2"', 'Hose 2" - Model 1076', 'Hose', 48.00, 54.00, 60.00, 25, false, '/assets/parts/template-hose.svg'),
('HOS-1077', '2-1/2"', 'Hose 2-1/2" - Model 1077', 'Hose', 56.00, 63.00, 70.00, 20, false, '/assets/parts/template-hose.svg'),
('HOS-1078', '3"', 'Hose 3" - Model 1078', 'Hose', 64.00, 72.00, 80.00, 15, false, '/assets/parts/template-hose.svg'),
('HOS-1079', '4"', 'Hose 4" - Model 1079', 'Hose', 80.00, 90.00, 100.00, 10, false, '/assets/parts/template-hose.svg'),
('HOS-1080', '1/2"', 'Hose 1/2" - Model 1080', 'Hose', 24.00, 27.00, 30.00, 48, false, '/assets/parts/template-hose.svg');

-- Tools
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('TL-1081', 'N/A', 'Tool N/A - Model 1081', 'Tool', 16.00, 18.00, 20.00, 40, true, '/assets/parts/template-tool.svg'),
('TL-1082', 'N/A', 'Tool N/A - Model 1082', 'Tool', 20.00, 22.50, 25.00, 35, true, '/assets/parts/template-tool.svg'),
('TL-1083', 'N/A', 'Tool N/A - Model 1083', 'Tool', 24.00, 27.00, 30.00, 30, true, '/assets/parts/template-tool.svg'),
('TL-1084', 'N/A', 'Tool N/A - Model 1084', 'Tool', 28.00, 31.50, 35.00, 25, true, '/assets/parts/template-tool.svg'),
('TL-1085', 'N/A', 'Tool N/A - Model 1085', 'Tool', 32.00, 36.00, 40.00, 20, true, '/assets/parts/template-tool.svg'),
('TL-1086', 'N/A', 'Tool N/A - Model 1086', 'Tool', 36.00, 40.50, 45.00, 18, false, '/assets/parts/template-tool.svg'),
('TL-1087', 'N/A', 'Tool N/A - Model 1087', 'Tool', 40.00, 45.00, 50.00, 15, false, '/assets/parts/template-tool.svg'),
('TL-1088', 'N/A', 'Tool N/A - Model 1088', 'Tool', 44.00, 49.50, 55.00, 12, false, '/assets/parts/template-tool.svg'),
('TL-1089', 'N/A', 'Tool N/A - Model 1089', 'Tool', 48.00, 54.00, 60.00, 10, false, '/assets/parts/template-tool.svg'),
('TL-1090', 'N/A', 'Tool N/A - Model 1090', 'Tool', 52.00, 58.50, 65.00, 8, false, '/assets/parts/template-tool.svg');

-- Accessories
INSERT INTO parts (item_code, pipe_size, description, type, price_t1, price_t2, price_t3, in_stock, is_popular, image)
VALUES 
('ACC-1091', 'N/A', 'Accessory N/A - Model 1091', 'Accessory', 8.00, 9.00, 10.00, 80, true, '/assets/parts/template-accessory.svg'),
('ACC-1092', 'N/A', 'Accessory N/A - Model 1092', 'Accessory', 10.40, 11.70, 13.00, 75, true, '/assets/parts/template-accessory.svg'),
('ACC-1093', 'N/A', 'Accessory N/A - Model 1093', 'Accessory', 12.80, 14.40, 16.00, 70, true, '/assets/parts/template-accessory.svg'),
('ACC-1094', 'N/A', 'Accessory N/A - Model 1094', 'Accessory', 15.20, 17.10, 19.00, 65, true, '/assets/parts/template-accessory.svg'),
('ACC-1095', 'N/A', 'Accessory N/A - Model 1095', 'Accessory', 17.60, 19.80, 22.00, 60, true, '/assets/parts/template-accessory.svg'),
('ACC-1096', 'N/A', 'Accessory N/A - Model 1096', 'Accessory', 20.00, 22.50, 25.00, 55, false, '/assets/parts/template-accessory.svg'),
('ACC-1097', 'N/A', 'Accessory N/A - Model 1097', 'Accessory', 22.40, 25.20, 28.00, 50, false, '/assets/parts/template-accessory.svg'),
('ACC-1098', 'N/A', 'Accessory N/A - Model 1098', 'Accessory', 24.80, 27.90, 31.00, 45, false, '/assets/parts/template-accessory.svg'),
('ACC-1099', 'N/A', 'Accessory N/A - Model 1099', 'Accessory', 27.20, 30.60, 34.00, 40, false, '/assets/parts/template-accessory.svg'),
('ACC-1100', 'N/A', 'Accessory N/A - Model 1100', 'Accessory', 29.60, 33.30, 37.00, 35, false, '/assets/parts/template-accessory.svg');