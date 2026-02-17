-- ============================================================
-- National Park Service Database - Sample Seed Data
-- Run after schema.sql to populate with demo data
-- ============================================================

PRAGMA foreign_keys=ON;

-- National Parks
INSERT OR IGNORE INTO NATIONAL_PARK VALUES ('Yellowstone National Park','1 Yellow Stone Rd','Yellowstone','Wyoming','82190','1872-03-01',3000);
INSERT OR IGNORE INTO NATIONAL_PARK VALUES ('Grand Canyon National Park','1 S Entrance Rd','Grand Canyon','Arizona','86023','1919-02-26',6000);
INSERT OR IGNORE INTO NATIONAL_PARK VALUES ('Yosemite National Park','9035 Village Dr','Yosemite Valley','California','95389','1890-10-01',5000);
INSERT OR IGNORE INTO NATIONAL_PARK VALUES ('Great Smoky Mountains NP','107 Park Headquarters Rd','Gatlinburg','Tennessee','37738','1934-06-15',8000);

-- Programs
INSERT OR IGNORE INTO PROGRAM VALUES ('Yellowstone National Park','Wolf Watch','Wildlife',    '2025-06-01',4);
INSERT OR IGNORE INTO PROGRAM VALUES ('Yellowstone National Park','Geyser Geology','Science', '2025-07-15',3);
INSERT OR IGNORE INTO PROGRAM VALUES ('Grand Canyon National Park','Rim Trail Hike','Hiking', '2025-05-20',6);
INSERT OR IGNORE INTO PROGRAM VALUES ('Yosemite National Park','El Cap View','Photography',   '2025-08-01',2);
INSERT OR IGNORE INTO PROGRAM VALUES ('Great Smoky Mountains NP','Firefly Festival','Nature', '2025-06-10',3);

-- Persons
INSERT OR IGNORE INTO PERSON VALUES ('P001','James','A','Wilson','1985-03-12','Male','123 Oak St','Bozeman','Montana','59715','406-555-0101','james.wilson@email.com',0);
INSERT OR IGNORE INTO PERSON VALUES ('P002','Maria',NULL,'Chen','1990-07-22','Female','456 Pine Ave','Flagstaff','Arizona','86001','928-555-0202','maria.chen@email.com',1);
INSERT OR IGNORE INTO PERSON VALUES ('P003','Elijah','T','Brooks','1978-11-05','Male','789 Maple Dr','Mariposa','California','95338','209-555-0303','elijah.brooks@email.com',1);
INSERT OR IGNORE INTO PERSON VALUES ('P004','Sofia',NULL,'Martinez','1995-04-18','Female','321 Cedar Ln','Gatlinburg','Tennessee','37738','865-555-0404','sofia.martinez@email.com',0);
INSERT OR IGNORE INTO PERSON VALUES ('P005','David','R','Thompson','1982-09-30','Male','654 Birch Rd','Cody','Wyoming','82414','307-555-0505','david.thompson@email.com',1);
INSERT OR IGNORE INTO PERSON VALUES ('P006','Aisha',NULL,'Johnson','2000-01-15','Female','987 Elm St','Phoenix','Arizona','85001','602-555-0606','aisha.johnson@email.com',1);
INSERT OR IGNORE INTO PERSON VALUES ('P007','Liam','C','Nguyen','1988-06-20','Male','147 Spruce Ct','Sacramento','California','95814','916-555-0707','liam.nguyen@email.com',0);
INSERT OR IGNORE INTO PERSON VALUES ('P008','Priya',NULL,'Patel','1993-12-03','Female','258 Willow Way','Knoxville','Tennessee','37901','865-555-0808','priya.patel@email.com',1);

-- Visitors
INSERT OR IGNORE INTO VISITOR VALUES ('P002');
INSERT OR IGNORE INTO VISITOR VALUES ('P004');
INSERT OR IGNORE INTO VISITOR VALUES ('P006');
INSERT OR IGNORE INTO VISITOR VALUES ('P008');

-- Rangers
INSERT OR IGNORE INTO RANGER VALUES ('P001','2015-04-01','active','Wildlife Management, First Aid, Fire Safety');
INSERT OR IGNORE INTO RANGER VALUES ('P003','2018-07-15','active','Rock Climbing, Search & Rescue');
INSERT OR IGNORE INTO RANGER VALUES ('P005','2012-01-10','active','Wildlife Management, Law Enforcement');

-- Researchers
INSERT OR IGNORE INTO RESEARCHER VALUES ('P007','Ecosystem Ecology','2020-08-01',92000.00);

-- Ranger Teams
INSERT OR IGNORE INTO RANGER_TEAM VALUES ('TEAM-WOLF','Wolf & Wildlife Monitoring','2015-05-01');
INSERT OR IGNORE INTO RANGER_TEAM VALUES ('TEAM-TRAIL','Trail Safety & Rescue','2018-09-01');

-- Team Memberships
INSERT OR IGNORE INTO INCLUDES VALUES ('P001','TEAM-WOLF',1);  -- leader
INSERT OR IGNORE INTO INCLUDES VALUES ('P005','TEAM-WOLF',0);  -- member
INSERT OR IGNORE INTO INCLUDES VALUES ('P003','TEAM-TRAIL',1); -- leader

-- Donors
INSERT OR IGNORE INTO DONOR VALUES ('P004',0);
INSERT OR IGNORE INTO DONOR VALUES ('P006',1);
INSERT OR IGNORE INTO DONOR VALUES ('P008',0);

-- Donations
INSERT OR IGNORE INTO DONATION VALUES ('P004','2025-01-15',500.00,'Winter Wildlife Fund');
INSERT OR IGNORE INTO DONATION VALUES ('P006','2025-01-20',250.00,'Winter Wildlife Fund');
INSERT OR IGNORE INTO DONATION VALUES ('P008','2025-02-05',1000.00,'Trail Restoration');
INSERT OR IGNORE INTO DONATION VALUES ('P006','2025-02-18',150.00,NULL);

-- Credit card details
INSERT OR IGNORE INTO CREDIT_CARD_DONATION VALUES ('P004','4521','Visa','2027-06-30');
INSERT OR IGNORE INTO CREDIT_CARD_DONATION VALUES ('P008','7890','Mastercard','2026-12-31');

-- Check details
INSERT OR IGNORE INTO CHECK_DONATION VALUES ('P006','CHK-88221');

-- Enrollments
INSERT OR IGNORE INTO ENROLL VALUES ('P002','Yellowstone National Park','Wolf Watch','2025-06-01',NULL);
INSERT OR IGNORE INTO ENROLL VALUES ('P002','Grand Canyon National Park','Rim Trail Hike','2025-05-20','Wheelchair accessible route needed');
INSERT OR IGNORE INTO ENROLL VALUES ('P004','Great Smoky Mountains NP','Firefly Festival','2025-06-10',NULL);
INSERT OR IGNORE INTO ENROLL VALUES ('P006','Yosemite National Park','El Cap View','2025-08-01',NULL);

-- Emergency Contacts
INSERT OR IGNORE INTO EMERGENCY_CONTACT VALUES ('P001','Linda Wilson','Spouse','406-555-9901');
INSERT OR IGNORE INTO EMERGENCY_CONTACT VALUES ('P003','Karen Brooks','Mother','209-555-9903');
INSERT OR IGNORE INTO EMERGENCY_CONTACT VALUES ('P005','Michael Thompson','Brother','307-555-9905');

-- Reports to researcher
INSERT OR IGNORE INTO REPORTS_TO VALUES ('TEAM-WOLF','P007','2025-03-01','Q1 wolf population survey complete. Pack sizes stable.');
INSERT OR IGNORE INTO REPORTS_TO VALUES ('TEAM-TRAIL','P007','2025-03-15','Trail erosion assessment submitted for spring repairs.');

-- Conservation Projects
INSERT OR IGNORE INTO CONSERVATION_PROJECT VALUES ('CP-001','Greater Yellowstone Wolf Recovery','2020-01-01',850000.00);
INSERT OR IGNORE INTO CONSERVATION_PROJECT VALUES ('CP-002','Grand Canyon Condor Program','2018-06-01',1200000.00);

-- Hosts
INSERT OR IGNORE INTO HOSTS VALUES ('CP-001','Yellowstone National Park');
INSERT OR IGNORE INTO HOSTS VALUES ('CP-002','Grand Canyon National Park');

-- Park Passes
INSERT OR IGNORE INTO PARK_PASS VALUES ('PASS-001','P002','America the Beautiful','2026-08-15');
INSERT OR IGNORE INTO PARK_PASS VALUES ('PASS-002','P008','Annual Pass','2025-03-01');

-- Holds
INSERT OR IGNORE INTO HOLDS VALUES ('PASS-001','P002');
INSERT OR IGNORE INTO HOLDS VALUES ('PASS-002','P008');

-- Mentorship
INSERT OR IGNORE INTO MENTORS VALUES ('P001','P005','2022-01-01');
