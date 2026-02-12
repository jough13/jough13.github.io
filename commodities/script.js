// --- DATA ---
const rawTableData = [{
      name: "SIGHT KIT",
      nsn: "1005-00-071-8030",
      nuclides: [{
         id: "Pm-147",
         activity: "1",
         units: "mCi"
      }]
   },
   {
      name: "RIFLE, 5.56 MILLIMETER",
      nsn: "1005-00-073-9421",
      nuclides: [{
         id: "H-3",
         activity: "9",
         units: "mCi"
      }]
   },
   {
      name: "POST ASSEMBLY",
      nsn: "1005-00-145-6378",
      nuclides: [{
         id: "Pm-147",
         activity: "1",
         units: "mCi"
      }]
   },
   {
      name: "POST ASSEMBLY",
      nsn: "1005-00-234-1568",
      nuclides: [{
         id: "H-3",
         activity: "9",
         units: "mCi"
      }]
   },
   {
      name: "SWITCH, TOGGLE",
      nsn: "5930-00-655-1514",
      nuclides: [{
         id: "Ra-226",
         activity: "0.15",
         units: "µCi"
      }]
   },
   {
      name: "WINDVANE ASSEMBLY",
      nsn: "1005-01-099-1450",
      nuclides: [{
         id: "Th-232",
         activity: "2.6",
         units: "pCi"
      }]
   },
   {
      name: "PISTOL, 9 MILLIMETER, AUTOMATIC",
      nsn: "1005-01-340-0096",
      nuclides: [{
         id: "H-3",
         activity: "54.1",
         units: "mCi"
      }]
   },
   {
      name: "RIFLE, 5.56 MILLIMETER",
      nsn: "1005-01-340-6037",
      nuclides: [{
         id: "H-3",
         activity: "9",
         units: "mCi"
      }]
   },
   {
      name: "MORTAR, 60 MILLIMETER",
      nsn: "1010-01-020-5626",
      nuclides: [{
         id: "H-3",
         activity: "29",
         units: "Ci"
      }]
   },
   {
      name: "SIGHT UNIT",
      nsn: "1240-01-174-1726",
      nuclides: [{
         id: "H-3",
         activity: "6.7",
         units: "Ci"
      }]
   },
   {
      name: "LIGHT, AIMING POST",
      nsn: "1290-00-169-1934",
      nuclides: [{
         id: "H-3",
         activity: "5",
         units: "Ci"
      }]
   },
   {
      name: "LIGHT, AIMING POST",
      nsn: "1290-00-169-1935",
      nuclides: [{
         id: "H-3",
         activity: "9",
         units: "Ci"
      }]
   },
   {
      name: "RANGE INDICATOR ASSEMBLY",
      nsn: "1010-01-115-3128",
      nuclides: [{
         id: "H-3",
         activity: "3.19",
         units: "Ci"
      }]
   },
   {
      name: "RANGE INDICATOR",
      nsn: "1010-01-237-9033",
      nuclides: [{
         id: "H-3",
         activity: "3.19",
         units: "Ci"
      }]
   },
   {
      name: "HOWITZER, LIGHT, TOWED, 105MM",
      nsn: "1015-00-086-8164",
      nuclides: [{
         id: "H-3",
         activity: "24.8",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, ELBOW",
      nsn: "1240-00-150-8886",
      nuclides: [{
         id: "H-3",
         activity: "3.81",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, PANORAMIC",
      nsn: "1240-00-150-8889",
      nuclides: [{
         id: "H-3",
         activity: "5.59",
         units: "Ci"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "1240-00-150-8890",
      nuclides: [{
         id: "H-3",
         activity: "150",
         units: "mCi"
      }]
   },
   {
      name: "COLLIMATOR, INFINITY AIMING REFERENCE",
      nsn: "1240-00-332-1780",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "QUADRANT, FIRE CONTROL",
      nsn: "1290-00-150-8891",
      nuclides: [{
         id: "H-3",
         activity: "2.2",
         units: "Ci"
      }]
   },
   {
      name: "QUADRANT, GUNNERS",
      nsn: "1290-00-169-1937",
      nuclides: [{
         id: "H-3",
         activity: "75.1",
         units: "mCi"
      }]
   },
   {
      name: "ALIGNMENT DEVICE, BORESIGHT",
      nsn: "4931-00-341-5119",
      nuclides: [{
         id: "H-3",
         activity: "3",
         units: "Ci"
      }]
   },
   {
      name: "ALIGNMENT DEVICE, BORESIGHT",
      nsn: "4931-01-187-9713",
      nuclides: [{
         id: "H-3",
         activity: "3",
         units: "Ci"
      }]
   },
   {
      name: "HOWITZER, LIGHT, TOWED, 105MM",
      nsn: "1015-00-322-9728",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "HOWITZER, LIGHT, TOWED, 105MM",
      nsn: "1015-00-322-9752",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "MORTAR, 81MM",
      nsn: "1015-01-164-6651",
      nuclides: [{
         id: "H-3",
         activity: "25.7",
         units: "Ci"
      }]
   },
   {
      name: "SIGHT UNIT",
      nsn: "1240-01-379-7953",
      nuclides: [{
         id: "H-3",
         activity: "6.7",
         units: "Ci"
      }]
   },
   {
      name: "MORTAR, 120MM",
      nsn: "1015-01-226-1672",
      nuclides: [{
         id: "H-3",
         activity: "24.8",
         units: "Ci"
      }]
   },
   {
      name: "SIGHT UNIT",
      nsn: "1240-01-366-7322",
      nuclides: [{
         id: "H-3",
         activity: "5.78",
         units: "Ci"
      }]
   },
   {
      name: "HOWITZER, TOWED, 105MM",
      nsn: "1015-01-248-0859",
      nuclides: [{
         id: "H-3",
         activity: "22.4",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, PANORAMIC",
      nsn: "1240-01-277-0472",
      nuclides: [{
         id: "H-3",
         activity: "5.11",
         units: "Ci"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "1240-01-277-0474",
      nuclides: [{
         id: "H-3",
         activity: "2.65",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, ELBOW",
      nsn: "1240-01-277-2875",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "MORTAR, CARRIER MOUNTED, 120MM",
      nsn: "1015-01-292-3801",
      nuclides: [{
         id: "H-3",
         activity: "24.8",
         units: "Ci"
      }]
   },
   {
      name: "HOWITZER, TOWED, 105MM",
      nsn: "1015-01-308-1872",
      nuclides: [{
         id: "H-3",
         activity: "22.4",
         units: "Ci"
      }]
   },
   {
      name: "RIFLE, RECOILLESS",
      nsn: "1015-01-314-1770",
      nuclides: [{
         id: "H-3",
         activity: "210",
         units: "mCi"
      }]
   },
   {
      name: "HOWITZER, MEDIUM, TOWED, 155MM",
      nsn: "1025-01-026-6648",
      nuclides: [{
         id: "H-3",
         activity: "26.6",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, PANORAMIC",
      nsn: "1240-01-038-0530",
      nuclides: [{
         id: "H-3",
         activity: "4.41",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, PANORAMIC",
      nsn: "1240-01-038-0531",
      nuclides: [{
         id: "H-3",
         activity: "5.11",
         units: "Ci"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "1240-01-039-7273",
      nuclides: [{
         id: "H-3",
         activity: "150",
         units: "mCi"
      }]
   },
   {
      name: "QUADRANT, FIRE CONTROL",
      nsn: "1290-01-037-3883",
      nuclides: [{
         id: "H-3",
         activity: "1.9",
         units: "Ci"
      }]
   },
   {
      name: "QUADRANT, FIRE CONTROL",
      nsn: "1290-01-037-7289",
      nuclides: [{
         id: "H-3",
         activity: "1.95",
         units: "Ci"
      }]
   },
   {
      name: "ALIGNMENT DEVICE",
      nsn: "4931-01-048-5834",
      nuclides: [{
         id: "H-3",
         activity: "3",
         units: "Ci"
      }]
   },
   {
      name: "SWITCH",
      nsn: "5930-00-655-1582",
      nuclides: [{
         id: "Ra-226",
         activity: "0.15",
         units: "µCi"
      }]
   },
   {
      name: "TURRET ASSEMBLY",
      nsn: "1220-01-308-3019",
      nuclides: [{
         id: "Th-232",
         activity: "81.1",
         units: "nCi"
      }]
   },
   {
      name: "OPTICAL IMAGING SET",
      nsn: "5855-01-201-4857",
      nuclides: [{
         id: "Th-232",
         activity: "16",
         units: "nCi"
      }]
   },
   {
      name: "CELL ASSEMBLY",
      nsn: "6650-01-169-9328",
      nuclides: [{
         id: "Th-232",
         activity: "30",
         units: "nCi"
      }]
   },
   {
      name: "PRISM",
      nsn: "6650-01-171-8538",
      nuclides: [{
         id: "Th-232",
         activity: "0.9",
         units: "nCi"
      }]
   },
   {
      name: "PRISM",
      nsn: "6650-01-171-8539",
      nuclides: [{
         id: "Th-232",
         activity: "2.81",
         units: "nCi"
      }]
   },
   {
      name: "LENS",
      nsn: "6650-01-176-3107",
      nuclides: [{
         id: "Th-232",
         activity: "14",
         units: "nCi"
      }]
   },
   {
      name: "LENS",
      nsn: "6650-01-176-3108",
      nuclides: [{
         id: "Th-232",
         activity: "17",
         units: "nCi"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-00-257-2770",
      nuclides: [{
         id: "H-3",
         activity: "800",
         units: "mCi"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-00-257-2774",
      nuclides: [{
         id: "H-3",
         activity: "1",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-00-257-2776",
      nuclides: [{
         id: "H-3",
         activity: "800",
         units: "mCi"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-096-4479",
      nuclides: [{
         id: "H-3",
         activity: "1.2",
         units: "Ci"
      }]
   },
   {
      name: "CELL ASSEMBLY",
      nsn: "1240-00-257-2759",
      nuclides: [{
         id: "H-3",
         activity: "4.41",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-135-3161",
      nuclides: [{
         id: "H-3",
         activity: "1.2",
         units: "Ci"
      }]
   },
   {
      name: "LEVEL ASSEMBLY",
      nsn: "1240-01-142-5381",
      nuclides: [{
         id: "H-3",
         activity: "150",
         units: "mCi"
      }]
   },
   {
      name: "LEVEL, FIRE CONTROL",
      nsn: "1290-00-257-2769",
      nuclides: [{
         id: "H-3",
         activity: "150",
         units: "mCi"
      }]
   },
   {
      name: "CELL ASSEMBLY",
      nsn: "1240-01-079-5453",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "COLLIMATOR",
      nsn: "1240-01-124-1358",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "MODIFICATION KIT, GUN, FIELD ARTILLERY",
      nsn: "9999-00-332-1779",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "Ci"
      }]
   },
   {
      name: "CELL ASSEMBLY",
      nsn: "1240-01-048-0779",
      nuclides: [{
         id: "H-3",
         activity: "4.41",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-113-7947",
      nuclides: [{
         id: "H-3",
         activity: "4.41",
         units: "Ci"
      }]
   },
   {
      name: "OBJECTIVE ASSEMBLY",
      nsn: "1240-01-043-9463",
      nuclides: [{
         id: "H-3",
         activity: "2.4",
         units: "Ci"
      }]
   },
   {
      name: "COUNTERBALANCE",
      nsn: "1240-01-044-6915",
      nuclides: [{
         id: "H-3",
         activity: "2.7",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE ASSEMBLY",
      nsn: "1240-01-062-8264",
      nuclides: [{
         id: "H-3",
         activity: "2.4",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6240-01-043-8209",
      nuclides: [{
         id: "H-3",
         activity: "2.7",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-051-9606",
      nuclides: [{
         id: "H-3",
         activity: "2.4",
         units: "Ci"
      }]
   },
   {
      name: "DISPLAY UNIT",
      nsn: "1240-01-063-1351",
      nuclides: [{
         id: "Th-232",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "DISPLAY UNIT",
      nsn: "1240-01-063-1401",
      nuclides: [{
         id: "Th-232",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "1240-01-050-5588",
      nuclides: [{
         id: "H-3",
         activity: "5.08",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE",
      nsn: "1240-01-051-3657",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "LAMP UNIT",
      nsn: "1240-01-051-8472",
      nuclides: [{
         id: "H-3",
         activity: "700",
         units: "mCi"
      }]
   },
   {
      name: "LEVEL, FIRE CONTROL",
      nsn: "1240-01-057-0112",
      nuclides: [{
         id: "H-3",
         activity: "100",
         units: "mCi"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "1240-01-201-8299",
      nuclides: [{
         id: "H-3",
         activity: "5.08",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, ELBOW",
      nsn: "1240-01-211-3608",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "SCALE, INDICATING",
      nsn: "5355-01-053-3354",
      nuclides: [{
         id: "H-3",
         activity: "1.2",
         units: "Ci"
      }]
   },
   {
      name: "DIAL, CONTROL",
      nsn: "5355-01-053-6448",
      nuclides: [{
         id: "H-3",
         activity: "2",
         units: "Ci"
      }]
   },
   {
      name: "DIAL, CONTROL",
      nsn: "5355-01-212-8527",
      nuclides: [{
         id: "H-3",
         activity: "2",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-053-3356",
      nuclides: [{
         id: "H-3",
         activity: "90",
         units: "mCi"
      }]
   },
   {
      name: "TELESCOPE, ELBOW",
      nsn: "1240-01-280-5337",
      nuclides: [{
         id: "H-3",
         activity: "2.5",
         units: "Ci"
      }]
   },
   {
      name: "LEVEL, FIRE CONTROL",
      nsn: "1240-01-287-9711",
      nuclides: [{
         id: "H-3",
         activity: "150",
         units: "mCi"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-283-8659",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "LAMP, NUCLEAR",
      nsn: "6260-01-280-1795",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "RETICLE, OPTICAL INSTRUMENT",
      nsn: "6650-01-287-9710",
      nuclides: [{
         id: "H-3",
         activity: "1.6",
         units: "Ci"
      }]
   },
   {
      name: "SUBASSEMBLY",
      nsn: "1240-01-306-2058",
      nuclides: [{
         id: "Th-232",
         activity: "6.41",
         units: "nCi"
      }]
   },
   {
      name: "PRISM",
      nsn: "6650-01-170-4494",
      nuclides: [{
         id: "Th-232",
         activity: "2.2",
         units: "nCi"
      }]
   },
   {
      name: "DIAL, CONTROL",
      nsn: "5355-01-342-2421",
      nuclides: [{
         id: "H-3",
         activity: "2",
         units: "Ci"
      }]
   },
   {
      name: "DIAL, SCALE",
      nsn: "5355-01-343-1793",
      nuclides: [{
         id: "H-3",
         activity: "1.1",
         units: "Ci"
      }]
   },
   {
      name: "MOUNT, TELESCOPE",
      nsn: "6650-01-340-6082",
      nuclides: [{
         id: "H-3",
         activity: "5",
         units: "Ci"
      }]
   },
   {
      name: "TELESCOPE, ELBOW",
      nsn: "6650-01-341-5195",
      nuclides: [{
         id: "H-3",
         activity: "800",
         units: "mCi"
      }]
   },
   {
      name: "DIAL, SCALE",
      nsn: "5355-01-212-8526",
      nuclides: [{
         id: "H-3",
         activity: "1.2",
         units: "Ci"
      }]
   },
   {
      name: "SIGHT, BORE, OPTICAL",
      nsn: "1240-01-412-6608",
      nuclides: [{
         id: "H-3",
         activity: "100",
         units: "mCi"
      }]
   },
   {
      name: "SIGHT, REFLEX",
      nsn: "1240-01-435-1916",
      nuclides: [{
         id: "H-3",
         activity: "100",
         units: "mCi"
      }]
   },
   {
      name: "SIGHT UNIT",
      nsn: "1240-01-507-8580",
      nuclides: [{
         id: "H-3",
         activity: "3.2",
         units: "Ci"
      }]
   },
   {
      name: "SIGHT, BORE, OPTICAL",
      nsn: "1240-01-525-1648",
      nuclides: [{
         id: "H-3",
         activity: "100",
         units: "mCi"
      }]
   },
   {
      name: "SIGHT, REFLEX",
      nsn: "1240-01-581-6250",
      nuclides: [{
         id: "H-3",
         activity: "250",
         units: "mCi"
      }]
   },
   {
      name: "SIGHT, REFLEX",
      nsn: "1240-25-150-7592",
      nuclides: [{
         id: "H-3",
         activity: "10",
         units: "mCi"
      }]
   },
   {
      name: "SOURCE, RADIOACTIVE",
      nsn: "1260-01-510-1032",
      nuclides: [{
         id: "Am-241",
         activity: "8",
         units: "µCi"
      }]
   },
   {
      name: "RECEIVER-TRANSMITTER",
      nsn: "1270-01-437-6581",
      nuclides: [{
         id: "Am-241",
         activity: "9",
         units: "µCi"
      }]
   },
   {
      name: "OPTICS ASSEMBLY",
      nsn: "1280-01-300-0940",
      nuclides: [{
         id: "Th-232",
         activity: "0.04",
         units: "µCi"
      }]
   },
   {
      name: "PROBE, ICE DETECTOR",
      nsn: "1660-00-077-8473",
      nuclides: [{
         id: "Sr-90",
         activity: "50",
         units: "µCi"
      }]
   },
   {
      name: "REGULATOR, OXYGEN, DILUTER DEMAND",
      nsn: "1660-00-252-7796",
      nuclides: [{
         id: "Ra-226",
         activity: "3",
         units: "µCi"
      }]
   },
   {
      name: "PROBE, ICE DETECTOR",
      nsn: "1660-00-919-0419",
      nuclides: [{
         id: "Sr-90",
         activity: "50",
         units: "µCi"
      }]
   },
   {
      name: "REGULATOR, OXYGEN, DEMAND",
      nsn: "1660-00-927-1996",
      nuclides: [{
         id: "Ra-226",
         activity: "1.2",
         units: "µCi"
      }]
   },
   {
      name: "SELECTOR, FREQUENCY, INSTRUMENT LANDING SYSTEM",
      nsn: "1660-01-483-2581",
      nuclides: [{
         id: "Kr-85",
         activity: "0.27",
         units: "µCi"
      }]
   },
   {
      name: "REGULATOR, OXYGEN, DEMAND",
      nsn: "1660-01-492-5521",
      nuclides: [{
         id: "Ra-226",
         activity: "1.2",
         units: "µCi"
      }]
   },
   {
      name: "POD, AIRCRAFT",
      nsn: "1680-01-186-1430",
      nuclides: [{
         id: "Th-232",
         activity: "0.03",
         units: "µCi"
      }]
   },
   {
      name: "SELECTOR, FREQUENCY, INSTRUMENT LANDING SYSTEM",
      nsn: "1680-01-415-5778",
      nuclides: [{
         id: "Kr-85",
         activity: "0.27",
         units: "µCi"
      }]
   },
   {
      name: "FLAP, VARIABLE EXHAUST NOZZLE, PRIMARY",
      nsn: "2480-01-450-1973",
      nuclides: [{
         id: "U-238",
         activity: "0.003",
         units: "µCi"
      }]
   },
   {
      name: "EXCITER, GAS TURBINE ENGINE",
      nsn: "2835-00-601-1317",
      nuclides: [{
         id: "Kr-85",
         activity: "6.9",
         units: "µCi"
      }]
   },
   {
      name: "IGNITER, TURBINE ENGINE, GAS",
      nsn: "2835-01-200-0298",
      nuclides: [{
         id: "Kr-85",
         activity: "0.224",
         units: "µCi"
      }]
   },
   {
      name: "POWER UNIT, GAS TURBINE ENGINE",
      nsn: "2835-01-267-8229",
      nuclides: [{
         id: "Kr-85",
         activity: "2.91",
         units: "µCi"
      }]
   },
   {
      name: "POWER UNIT",
      nsn: "2835-01-373-4275",
      nuclides: [{
         id: "Kr-85",
         activity: "2.92",
         units: "µCi"
      }]
   },
   {
      name: "FLAP, VARIABLE EXHAUST NOZZLE, SECONDARY",
      nsn: "2840-01-438-9479",
      nuclides: [{
         id: "U-238",
         activity: "0.03",
         units: "µCi"
      }]
   },
   {
      name: "SEAL, VARIABLE EXHAUST NOZZLE, SECONDARY",
      nsn: "2840-01-440-7755",
      nuclides: [{
         id: "U-238",
         activity: "0.002",
         units: "µCi"
      }]
   },
   {
      name: "MIXER, AFTERBURNER",
      nsn: "2840-01-450-1980",
      nuclides: [{
         id: "U-238",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "SEAL, VARIABLE EXHAUST NOZZLE, PRIMARY",
      nsn: "2840-01-450-1982",
      nuclides: [{
         id: "U-238",
         activity: "0.001",
         units: "µCi"
      }]
   },
   {
      name: "FLAMEHOLDER, AFTERBURNER",
      nsn: "2840-01-450-3755",
      nuclides: [{
         id: "U-238",
         activity: "0.06",
         units: "µCi"
      }]
   },
   {
      name: "IGNITION UNIT",
      nsn: "2925-00-133-9594",
      nuclides: [{
         id: "Kr-85",
         activity: "0.084",
         units: "µCi"
      }]
   },
   {
      name: "VIBRATOR, IGNITION COIL",
      nsn: "2925-00-706-2720",
      nuclides: [{
         id: "Cs-137",
         activity: "10",
         units: "µCi"
      }]
   },
   {
      name: "IGNITION UNIT",
      nsn: "2925-00-800-3403",
      nuclides: [{
         id: "Kr-85",
         activity: "5",
         units: "µCi"
      }]
   },
   {
      name: "VIBRATOR, IGNITION COIL",
      nsn: "2925-00-968-9594",
      nuclides: [{
         id: "Cs-137",
         activity: "5",
         units: "µCi"
      }]
   },
   {
      name: "VIBRATOR, IGNITION COIL",
      nsn: "2925-01-022-3181",
      nuclides: [{
         id: "H-3",
         activity: "13",
         units: "µCi"
      }]
   },
   {
      name: "IGNITION EXCITER",
      nsn: "2925-01-057-6993",
      nuclides: [{
         id: "Kr-85",
         activity: "2.9",
         units: "µCi"
      }]
   },
   {
      name: "VIBRATOR, IGNITION",
      nsn: "2925-01-077-3310",
      nuclides: [{
         id: "Kr-85",
         activity: "0.3",
         units: "µCi"
      }]
   },
   {
      name: "VIBRATOR, IGNITION",
      nsn: "2925-01-077-6866",
      nuclides: [{
         id: "Kr-85",
         activity: "0.2",
         units: "µCi"
      }]
   },
   {
      name: "COIL, IGNITION-EXCITER",
      nsn: "2925-01-323-9835",
      nuclides: [{
         id: "Kr-85",
         activity: "6",
         units: "mCi"
      }]
   },
   {
      name: "IGNITER, SPARK GAP",
      nsn: "2925-01-550-0177",
      nuclides: [{
         id: "Kr-85",
         activity: "0.173",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRODE, WELDING",
      nsn: "3439-00-105-9945",
      nuclides: [{
         id: "Th-232",
         activity: "0.2",
         units: "µCi"
      }]
   },
   {
      name: "DETECTOR, IONIZATION",
      nsn: "4210-00-595-5139",
      nuclides: [{
         id: "Am-241",
         activity: "4",
         units: "µCi"
      }]
   },
   {
      name: "SEALED SOURCE, IONIZATION, SMOKE ALARM",
      nsn: "4210-01-185-2762",
      nuclides: [{
         id: "Am-241",
         activity: "1.6",
         units: "µCi"
      }]
   },
   {
      name: "DETECTOR, GAMMA",
      nsn: "4470-00-444-3666",
      nuclides: [{
         id: "C-14",
         activity: "100",
         units: "µCi"
      }]
   },
   {
      name: "PROCESSOR, VIDEO SIGNAL",
      nsn: "5836-01-052-6952",
      nuclides: [{
         id: "Th-232",
         activity: "0.002",
         units: "µCi"
      }]
   },
   {
      name: "INDICATOR, RANGE",
      nsn: "5840-01-458-6159",
      nuclides: [{
         id: "H-3",
         activity: "3.2",
         units: "Ci"
      }]
   },
   {
      name: "INDICATOR, RANGE",
      nsn: "5840-01-642-5687",
      nuclides: [{
         id: "H-3",
         activity: "3.2",
         units: "Ci"
      }]
   },
   {
      name: "SPARK GAP, RADAR",
      nsn: "5841-01-054-6758",
      nuclides: [{
         id: "Kr-85",
         activity: "25",
         units: "mCi"
      }]
   },
   {
      name: "RECEIVER-TRANSMITTER",
      nsn: "5841-01-056-8647",
      nuclides: [{
         id: "H-3",
         activity: "15",
         units: "mCi"
      }]
   },
   {
      name: "RECEIVER-EXCITER",
      nsn: "5841-01-554-2099",
      nuclides: [{
         id: "Pm-147",
         activity: "30",
         units: "µCi"
      }]
   },
   {
      name: "IMAGE INTENSIFIER ASSEMBLY",
      nsn: "5855-00-087-2948",
      nuclides: [{
         id: "Th-232",
         activity: "4.9",
         units: "µCi"
      }]
   },
   {
      name: "NIGHT VISION SIGHT, INDIVIDUAL SERVED WEAPON",
      nsn: "5855-00-147-2508",
      nuclides: [{
         id: "Th-232",
         activity: "15.2",
         units: "µCi"
      }]
   },
   {
      name: "LENS ASSEMBLY",
      nsn: "5855-00-156-4992",
      nuclides: [{
         id: "Th-232",
         activity: "5.8",
         units: "µCi"
      }]
   },
   {
      name: "IMAGE INTENSIFIER ASSEMBLY",
      nsn: "5855-00-177-3502",
      nuclides: [{
         id: "Th-232",
         activity: "4.89",
         units: "µCi"
      }]
   },
   {
      name: "LENS CAP",
      nsn: "5855-00-409-0915",
      nuclides: [{
         id: "Th-232",
         activity: "2.9",
         units: "µCi"
      }]
   },
   {
      name: "NIGHT VISION SIGHT, INDIVIDUAL SERVED WEAPON",
      nsn: "5855-00-688-9954",
      nuclides: [{
         id: "Th-232",
         activity: "2.9",
         units: "µCi"
      }]
   },
   {
      name: "NIGHT VISION SIGHT SUBASSEMBLY",
      nsn: "5855-00-791-1653",
      nuclides: [{
         id: "Th-232",
         activity: "2.9",
         units: "µCi"
      }]
   },
   {
      name: "NIGHT VISION SIGHT",
      nsn: "5855-00-908-9314",
      nuclides: [{
         id: "Th-232",
         activity: "15.2",
         units: "µCi"
      }]
   },
   {
      name: "EYEPIECE ASSEMBLY, NIGHT VISION SIGHT",
      nsn: "5855-00-941-3037",
      nuclides: [{
         id: "Th-232",
         activity: "2.9",
         units: "µCi"
      }]
   },
   {
      name: "COLLIMATOR, BORESIGHT",
      nsn: "5855-01-029-8730",
      nuclides: [{
         id: "Th-232",
         activity: "6",
         units: "nCi"
      }]
   },
   {
      name: "NIGHT VISION SIGHT",
      nsn: "5855-01-037-7339",
      nuclides: [{
         id: "Th-232",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "RECEIVER-CONVERTER, INFRARED",
      nsn: "5855-01-052-6849",
      nuclides: [{
         id: "Th-232",
         activity: "0.0015",
         units: "µCi"
      }]
   },
   {
      name: "AFOCAL ASSEMBLY",
      nsn: "5855-01-052-6944",
      nuclides: [{
         id: "Th-232",
         activity: "0.002",
         units: "µCi"
      }]
   },
   {
      name: "IMAGER, INFRARED",
      nsn: "5855-01-053-0672",
      nuclides: [{
         id: "Th-232",
         activity: "0.0015",
         units: "µCi"
      }]
   },
   {
      name: "INFRARED VIEWING SET",
      nsn: "5855-01-093-3080",
      nuclides: [{
         id: "Th-232",
         activity: "0.1",
         units: "µCi"
      }]
   },
   {
      name: "IMAGE INTENSIFIER ASSEMBLY",
      nsn: "5855-01-352-7033",
      nuclides: [{
         id: "Th-232",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "WINDOW, INFRARED",
      nsn: "5855-01-377-7112",
      nuclides: [{
         id: "Th-232",
         activity: "0.0015",
         units: "µCi"
      }]
   },
   {
      name: "DETECTOR-DEWAR",
      nsn: "5855-01-486-0038",
      nuclides: [{
         id: "Th-232",
         activity: "0.2",
         units: "µCi"
      }]
   },
   {
      name: "DUPLEXER",
      nsn: "5895-00-056-7033",
      nuclides: [{
         id: "Co-60",
         activity: "0.8",
         units: "µCi"
      }]
   },
   {
      name: "CONTROL, RECEIVER",
      nsn: "5895-00-688-6030",
      nuclides: [{
         id: "Ra-226",
         activity: "0.17",
         units: "µCi"
      }]
   },
   {
      name: "TUBE, TRANSMIT-RECEIVE",
      nsn: "5895-01-375-6748",
      nuclides: [{
            id: "Co-60",
            activity: "0.25",
            units: "µCi"
         },
         {
            id: "H-3",
            activity: "12510",
            units: "µCi"
         }
      ]
   },
   {
      name: "SWITCH, TOGGLE",
      nsn: "5930-00-615-9376",
      nuclides: [{
         id: "Ra-226",
         activity: "150",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-001-1632",
      nuclides: [{
         id: "Th-232",
         activity: "0.22",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-054-1987",
      nuclides: [{
         id: "Th-232",
         activity: "3",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-060-3449",
      nuclides: [{
         id: "Th-232",
         activity: "1.1",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-114-4849",
      nuclides: [{
         id: "Th-232",
         activity: "0.018",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-131-6742",
      nuclides: [{
         id: "Co-60",
         activity: "0.7",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-134-6004",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-134-6012",
      nuclides: [{
         id: "Re-187",
         activity: "0.446",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-134-6031",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-134-6064",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-134-6073",
      nuclides: [{
         id: "Re-187",
         activity: "0.0889",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-140-1600",
      nuclides: [{
         id: "Kr-85",
         activity: "0.001",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-148-4724",
      nuclides: [{
         id: "Ni-63",
         activity: "0.5",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-168-8386",
      nuclides: [{
         id: "Th-232",
         activity: "1.1",
         units: "nCi"
      }]
   },
   {
      name: "TUBE, ELECTRON",
      nsn: "5960-00-170-4582",
      nuclides: [{
         id: "H-3",
         activity: "1",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-179-4446",
      nuclides: [{
         id: "Re-187",
         activity: "10",
         units: "pCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-188-0968",
      nuclides: [{
         id: "Kr-85",
         activity: "0.05",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-188-3565",
      nuclides: [{
         id: "Co-60",
         activity: "1",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-188-3574",
      nuclides: [{
         id: "Re-187",
         activity: "0.02",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-188-8612",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-193-5127",
      nuclides: [{
         id: "Th-232",
         activity: "0.26",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-220-6892",
      nuclides: [{
         id: "Co-60",
         activity: "0.09",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-262-0161",
      nuclides: [{
         id: "Re-187",
         activity: "0.02",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-262-0163",
      nuclides: [{
         id: "Re-187",
         activity: "0.02",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-262-0210",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-262-0286",
      nuclides: [{
         id: "Co-60",
         activity: "0.02",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-280-5585",
      nuclides: [{
         id: "Re-187",
         activity: "0.01",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-297-7099",
      nuclides: [{
         id: "Th-232",
         activity: "1.1",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-307-9918",
      nuclides: [{
         id: "Th-232",
         activity: "1.1",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-338-0377",
      nuclides: [{
         id: "Th-232",
         activity: "1.1",
         units: "nCi"
      }]
   },
   {
      name: "MAGNETRON",
      nsn: "5960-00-476-4750",
      nuclides: [{
         id: "H-3",
         activity: "1",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-503-4880",
      nuclides: [{
         id: "Kr-85",
         activity: "0.03",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-542-7004",
      nuclides: [{
         id: "Re-187",
         activity: "0.04",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-552-0082",
      nuclides: [{
         id: "Re-187",
         activity: "0.02",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-552-8277",
      nuclides: [{
         id: "U-238",
         activity: "0.08",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-615-5619",
      nuclides: [{
         id: "Th-232",
         activity: "120",
         units: "pCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-624-4718",
      nuclides: [{
         id: "Ra-226",
         activity: "6",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-681-8037",
      nuclides: [{
         id: "Co-60",
         activity: "0.15",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-682-8627",
      nuclides: [{
         id: "Re-187",
         activity: "0.0889",
         units: "nCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-713-7014",
      nuclides: [{
         id: "U-238",
         activity: "0.08",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-752-6384",
      nuclides: [{
         id: "H-3",
         activity: "1",
         units: "µCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-00-827-8782",
      nuclides: [{
         id: "Re-187",
         activity: "4.46",
         units: "nCi"
      }]
   },
   {
      name: "TUBE, ELECTRON",
      nsn: "5960-01-008-1351",
      nuclides: [{
         id: "H-3",
         activity: "30",
         units: "mCi"
      }]
   },
   {
      name: "TUBE, ELECTRON",
      nsn: "5960-01-008-1352",
      nuclides: [{
         id: "H-3",
         activity: "30",
         units: "mCi"
      }]
   },
   {
      name: "ELECTRON TUBE",
      nsn: "5960-01-013-9344",
      nuclides: [{
         id: "Co-60",
         activity: "0.1",
         units: "µCi"
      }]
   },
   {
      name: "RADIAC SET",
      nsn: "6665-00-017-8903",
      nuclides: [{
         id: "Kr-85",
         activity: "5",
         units: "mCi"
      }]
   },
   {
      name: "DETECTOR",
      nsn: "6665-01-282-7139",
      nuclides: [{
         id: "Tc-99",
         activity: "0.2",
         units: "µCi"
      }]
   },
   {
      name: "RADIAC CALIBRATOR",
      nsn: "6665-01-333-5985",
      nuclides: [{
         id: "Tc-99",
         activity: "0.2",
         units: "µCi"
      }]
   },
   {
      name: "DETECTOR, CHEMICAL AGENT, AUTOMATIC",
      nsn: "6665-01-438-3673",
      nuclides: [{
         id: "Ni-63",
         activity: "30",
         units: "mCi"
      }]
   },
   {
      name: "DETECTOR KIT, CHEMICAL AGENT",
      nsn: "6665-01-491-8523",
      nuclides: [{
         id: "Ni-63",
         activity: "10",
         units: "mCi"
      }]
   },
   {
      name: "SOURCE SET, RADIOACTIVITY",
      nsn: "6665-01-546-6120",
      nuclides: [{
         id: "Sr-90",
         activity: "0.15",
         units: "µCi"
      }]
   },
   {
      name: "DETECTOR, CHEMICAL AGENT",
      nsn: "6665-99-203-6162",
      nuclides: [{
         id: "Ni-63",
         activity: "30",
         units: "mCi"
      }]
   },
   {
      name: "CHEMICAL AGENT MONITOR",
      nsn: "6665-99-725-9996",
      nuclides: [{
         id: "Ni-63",
         activity: "10",
         units: "mCi"
      }]
   },
   {
      name: "INDICATOR, PRESSURE",
      nsn: "6685-01-356-9967",
      nuclides: [{
         id: "Sr-90",
         activity: "100",
         units: "µCi"
      }]
   },
];

const radionuclideDetails = {
   'H-3': {
      name: 'Tritium',
      halfLife: '12.3 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Tritium'
   },
   'Am-241': {
      name: 'Americium-241',
      halfLife: '432.2 years',
      decayMode: 'Alpha, Gamma',
      wiki: 'https://en.wikipedia.org/wiki/Americium-241'
   },
   'Th-232': {
      name: 'Thorium-232',
      halfLife: '14.05 billion years',
      decayMode: 'Alpha',
      wiki: 'https://en.wikipedia.org/wiki/Thorium-232'
   },
   'Sr-90': {
      name: 'Strontium-90',
      halfLife: '28.8 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Strontium-90'
   },
   'Ra-226': {
      name: 'Radium-226',
      halfLife: '1600 years',
      decayMode: 'Alpha, Gamma',
      wiki: 'https://en.wikipedia.org/wiki/Radium-226'
   },
   'Kr-85': {
      name: 'Krypton-85',
      halfLife: '10.75 years',
      decayMode: 'Beta, Gamma',
      wiki: 'https://en.wikipedia.org/wiki/Krypton-85'
   },
   'U-238': {
      name: 'Uranium-238',
      halfLife: '4.468 billion years',
      decayMode: 'Alpha',
      wiki: 'https://en.wikipedia.org/wiki/Uranium-238'
   },
   'Cs-137': {
      name: 'Caesium-137',
      halfLife: '30.17 years',
      decayMode: 'Beta, Gamma',
      wiki: 'https://en.wikipedia.org/wiki/Caesium-137'
   },
   'Pm-147': {
      name: 'Promethium-147',
      halfLife: '2.62 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Promethium-147'
   },
   'Co-60': {
      name: 'Cobalt-60',
      halfLife: '5.27 years',
      decayMode: 'Beta, Gamma',
      wiki: 'https://en.wikipedia.org/wiki/Cobalt-60'
   },
   'Re-187': {
      name: 'Rhenium-187',
      halfLife: '43.3 billion years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Rhenium-187'
   },
   'Ni-63': {
      name: 'Nickel-63',
      halfLife: '100.1 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Nickel-63'
   },
   'C-14': {
      name: 'Carbon-14',
      halfLife: '5730 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Carbon-14'
   },
   'Tc-99': {
      name: 'Technetium-99',
      halfLife: '211,100 years',
      decayMode: 'Beta',
      wiki: 'https://en.wikipedia.org/wiki/Technetium-99'
   }
};

const nrcExemptionValues = {
   'Am-241': '0.01 µCi',
   'C-14': '100 µCi',
   'Cs-137': '10 µCi',
   'Co-60': '1 µCi',
   'H-3': '1,000 µCi',
   'Kr-85': '100 µCi',
   'Ni-63': '100 µCi',
   'Pm-147': '10 µCi',
   'Ra-226': '0.1 µCi',
   'Re-187': '100 µCi',
   'Sr-90': '0.1 µCi',
   'Tc-99': '10 µCi',
   'Th-232': '--',
   'U-238': '--'
};
const dotExemptionValues = {
   'H-3': '27 mCi',
   'Am-241': '0.27 µCi',
   'Th-232': '0.27 µCi',
   'Sr-90': '0.27 µCi',
   'Ra-226': '0.27 µCi',
   'Kr-85': '0.27 µCi',
   'U-238': '0.27 µCi',
   'Cs-137': '0.27 µCi',
   'Pm-147': '270 µCi',
   'Co-60': '2.7 µCi',
   'Re-187': '27 mCi',
   'Ni-63': '2.7 mCi',
   'C-14': '270 µCi',
   'Tc-99': '270 µCi'
};
const un2911Limits = {
   'Am-241': '0.00027 Ci',
   'C-14': '0.81 Ci',
   'Co-60': '0.11 Ci',
   'Cs-137': '0.16 Ci',
   'H-3': '22 Ci',
   'Kr-85': '0.27 Ci',
   'Ni-63': '8.1 Ci',
   'Pm-147': '0.54 Ci',
   'Ra-226': '0.00081 Ci',
   'Re-187': 'Unlimited',
   'Sr-90': '0.081 Ci',
   'Tc-99': '0.24 Ci',
   'Th-232': 'Unlimited',
   'U-238': 'Unlimited'
};
const un2911PkgLimits = {
   'Am-241': '0.027 Ci',
   'C-14': '81 Ci',
   'Co-60': '11 Ci',
   'Cs-137': '16 Ci',
   'H-3': '220 Ci',
   'Kr-85': '2.7 Ci',
   'Ni-63': '810 Ci',
   'Pm-147': '54 Ci',
   'Ra-226': '0.081 Ci',
   'Re-187': 'Unlimited',
   'Sr-90': '8.1 Ci',
   'Tc-99': '24 Ci',
   'Th-232': 'Unlimited',
   'U-238': 'Unlimited'
};
const dotA2Values = {
   'Am-241': '0.027 Ci',
   'C-14': '54 Ci',
   'Co-60': '11 Ci',
   'Cs-137': '16 Ci',
   'H-3': '1100 Ci',
   'Kr-85': '270 Ci',
   'Ni-63': '810 Ci',
   'Pm-147': '54 Ci',
   'Ra-226': '0.54 Ci',
   'Re-187': 'Unlimited',
   'Sr-90': '8.1 Ci',
   'Tc-99': '54 Ci',
   'Th-232': 'Unlimited',
   'U-238': 'Unlimited'
};

// --- GLOBAL STATE ---
let tableData = [];
let currentSort = {
   column: null,
   direction: 'asc'
};

let currentPage = 1;
const itemsPerPage = 50;

// Track selections permanently
const selectedIds = new Set();

// --- UTILITY FUNCTIONS ---

function formatNSN(value) {
   // Strip non-alphanumeric chars
   let clean = value.replace(/[^a-zA-Z0-9]/g, '');
   if (clean.length > 13) clean = clean.substring(0, 13);

   // Insert hyphens: XXXX-XX-XXX-XXXX
   if (clean.length > 9) {
      return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,9)}-${clean.slice(9)}`;
   } else if (clean.length > 6) {
      return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6)}`;
   } else if (clean.length > 4) {
      return `${clean.slice(0,4)}-${clean.slice(4)}`;
   }
   return clean;
}

const CI_TO_BQ = 3.7e10;
const ciMultipliers = {
   'pci': 1e-12,
   'nci': 1e-9,
   'µci': 1e-6,
   'uci': 1e-6,
   'mci': 1e-3,
   'ci': 1
};

function safeSetItem(key, value) {
   try {
      localStorage.setItem(key, value);
   } catch (e) {
      console.error(`Failed to set item "${key}":`, e);
   }
}

function safeGetItem(key) {
   try {
      return localStorage.getItem(key);
   } catch (e) {
      console.error(`Failed to get item "${key}":`, e);
      return null;
   }
}

function safeRemoveItem(key) {
   try {
      localStorage.removeItem(key);
   } catch (e) {
      console.error(`Failed to remove item "${key}":`, e);
   }
}

function formatNumberWithCommas(number) {
   return number.toLocaleString('en-US');
}

function parseValueToCi(valueStr) {
   if (typeof valueStr !== 'string' || valueStr === '--' || !valueStr) {
      return null;
   }

   // 1. Handle "Unlimited" correctly for math operations
   if (valueStr.toLowerCase().includes('unlimited')) {
      return Infinity;
   }

   // 2. Handle missing spaces (e.g. "10mCi" -> "10 mCi")
   // Regex now supports Scientific Notation (e.g. 1.2e-5)
   const parts = valueStr.match(/([0-9.eE+-]+)\s*([a-zA-Zµ]+)/);

   if (!parts) {
      // Fallback for just a number (assume Ci)
      const val = parseFloat(valueStr.replace(/,/g, ''));
      return isNaN(val) ? null : val;
   }

   const value = parseFloat(parts[1]);
   const unit = parts[2] || 'Ci';
   const multiplier = ciMultipliers[unit.trim().toLowerCase()] || 1;

   return isNaN(value) ? null : value * multiplier;
}

function formatCi(valueCi) {
   if (valueCi === null || typeof valueCi === 'undefined') return '--';
   if (valueCi === Infinity) return 'Unlimited';
   if (valueCi === 0) return '0 Ci';

   const units = ['pCi', 'nCi', 'µCi', 'mCi', 'Ci'];
   let unitIndex = 4;
   let value = valueCi;

   while (value < 1 && unitIndex > 0) {
      value *= 1000;
      unitIndex--;
   }
   return `${formatNumberWithCommas(parseFloat(value.toPrecision(3)))} ${units[unitIndex]}`;
}

function formatBq(valueCi) {
   if (valueCi === null || typeof valueCi === 'undefined') return '--';
   if (valueCi === Infinity) return 'Unlimited'; // NEW
   if (valueCi === 0) return '0 Bq';

   let valueBq = valueCi * CI_TO_BQ;
   const units = ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'];
   let unitIndex = 0;

   while (valueBq >= 1000 && unitIndex < units.length - 1) {
      valueBq /= 1000;
      unitIndex++;
   }

   // Fix rounding edge cases (e.g. 999.9 -> 1.00 next unit)
   let displayValue = parseFloat(valueBq.toPrecision(3));
   if (displayValue >= 999 && unitIndex < units.length - 1) {
      displayValue = 1;
      unitIndex++;
   }

   return `${formatNumberWithCommas(displayValue)} ${units[unitIndex]}`;
}

function escapeHTML(str) {
   if (typeof str !== 'string') return str;
   const p = document.createElement('p');
   p.textContent = str;
   return p.innerHTML;
}

function activateFocusTrap(modalElement) {
   const focusableElements = modalElement.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
   );
   if (focusableElements.length === 0) return;
   const firstElement = focusableElements[0];
   const lastElement = focusableElements[focusableElements.length - 1];
   setTimeout(() => firstElement.focus(), 100);

   function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
         if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
         }
      } else {
         if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
         }
      }
   }
   modalElement.addEventListener('keydown', handleKeyDown);
   return () => {
      modalElement.removeEventListener('keydown', handleKeyDown);
   };
}

// --- CORE LOGIC ---
function processData(baseData, customData) {
   const processed = [];
   let uniqueId = 0;
   baseData.forEach(item => {
      if (item.nuclides && item.nuclides.length > 0) {
         item.nuclides.forEach(nuclide => {
            const flatItem = {
               name: item.name,
               nsn: item.nsn,
               radionuclide: nuclide.id,
               activity: nuclide.activity,
               units: nuclide.units
            };
            processed.push(createRowObject(flatItem, uniqueId++, false));
         });
      }
   });
   customData.forEach(item => {
      processed.push(createRowObject(item, item.id, true));
   });
   return processed;
}

function createRowObject(item, id, isCustom = false) {
   // Normalize radionuclide to match dictionary keys (case-insensitive lookup)
   const rawNuclide = item.radionuclide.trim();
   // Find the matching key in your data object, ignoring case
   const radionuclide = Object.keys(nrcExemptionValues).find(key =>
      key.toLowerCase() === rawNuclide.toLowerCase()
   ) || rawNuclide; // Fallback to original if not found

   const activityVal = parseValueToCi(`${item.activity} ${item.units}`);
   const nrcExemptionVal = parseValueToCi(nrcExemptionValues[radionuclide]);
   const dotExemptionVal = parseValueToCi(dotExemptionValues[radionuclide]);
   const un2911LimitVal = parseValueToCi(un2911Limits[radionuclide]);
   const un2911PkgLimitVal = parseValueToCi(un2911PkgLimits[radionuclide]);
   const dotA2Val = parseValueToCi(dotA2Values[radionuclide]);
   return {
      id: id,
      isCustom: isCustom,
      name: item.name,
      nsn: item.nsn,
      niin: item.niin || (item.nsn ? item.nsn.substring(5).replace(/-/g, '') : ''),
      radionuclide: radionuclide,
      activity_val: activityVal,
      nrc_exemption_val: nrcExemptionVal,
      dot_exemption_val: dotExemptionVal,
      un2911_limit_val: un2911LimitVal,
      un2911_pkg_limit_val: un2911PkgLimitVal,
      dot_a2_val: dotA2Val,
      activity_ci_str: formatCi(activityVal),
      nrc_exemption_ci_str: nrcExemptionVal !== null ? formatCi(nrcExemptionVal) : (nrcExemptionValues[radionuclide] || 'N/A'),
      dot_exemption_ci_str: dotExemptionVal !== null ? formatCi(dotExemptionVal) : (dotExemptionValues[radionuclide] || 'N/A'),
      un2911_limit_ci_str: un2911LimitVal !== null ? formatCi(un2911LimitVal) : 'Unlimited',
      un2911_pkg_limit_ci_str: un2911PkgLimitVal !== null ? formatCi(un2911PkgLimitVal) : 'Unlimited',
      activity_bq_str: formatBq(activityVal),
      nrc_exemption_bq_str: nrcExemptionVal !== null ? formatBq(nrcExemptionVal) : (nrcExemptionValues[radionuclide] || 'N/A'),
      dot_exemption_bq_str: dotExemptionVal !== null ? formatBq(dotExemptionVal) : (dotExemptionValues[radionuclide] || 'N/A'),
      un2911_limit_bq_str: un2911LimitVal !== null ? formatBq(un2911LimitVal) : 'Unlimited',
      un2911_pkg_limit_bq_str: un2911PkgLimitVal !== null ? formatBq(un2911PkgLimitVal) : 'Unlimited',
   };
}

function highlightText(text, searchTerm) {
   if (!searchTerm || !text) {
      return text ? escapeHTML(text) : '';
   }

   // 1. Clean up the search term (remove hyphens/spaces for loose matching)
   const cleanSearch = searchTerm.replace(/[-\s]/g, '');

   // 2. If the search term is empty after cleaning (e.g., user just typed a hyphen), do nothing
   if (!cleanSearch) return escapeHTML(text);

   // 3. Create a flexible regex pattern from the clean search term
   //    "123" becomes /1[-\s]*2[-\s]*3/gi
   //    This matches "123", "1-2-3", "1 2 3", etc.
   const pattern = cleanSearch.split('').map(char => {
      // Escape special regex characters if the user types them (like . or *)
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[-\\s]*';
   }).join('');

   const regex = new RegExp(`(${pattern})`, 'gi');

   // 4. Run the replace on the original text
   return escapeHTML(text).replace(regex, `<span class="highlight">$1</span>`);
}

function populateTable(data) {
   const tableBody = document.querySelector('#lookupTable tbody');
   const isSiUnits = document.getElementById('unitToggle').checked;
   const searchTerm = document.getElementById('searchInput').value;
   const paginationControls = document.getElementById('paginationControls');

   // Calculate pagination slices
   const totalItems = data.length;
   const startIdx = (currentPage - 1) * itemsPerPage;
   const endIdx = startIdx + itemsPerPage;
   const pageData = data.slice(startIdx, endIdx);

   tableBody.innerHTML = '';

   if (totalItems === 0) {
      paginationControls.classList.add('hidden');
      return;
   } else {
      paginationControls.classList.remove('hidden');
   }

   const rows = pageData.map((item) => {
      const isSelected = selectedIds.has(String(item.id));
      const nrcExemption = isSiUnits ? item.nrc_exemption_bq_str : item.nrc_exemption_ci_str;
      const dotExemption = isSiUnits ? item.dot_exemption_bq_str : item.dot_exemption_ci_str;
      const un2911Limit = isSiUnits ? item.un2911_limit_bq_str : item.un2911_limit_ci_str;
      const un2911PkgLimit = isSiUnits ? item.un2911_pkg_limit_bq_str : item.un2911_pkg_limit_ci_str;
      const activity = isSiUnits ? item.activity_bq_str : item.activity_ci_str;

      const rowClasses = ['border-b', 'dark:border-gray-700', 'hover:bg-gray-50', 'dark:hover:bg-gray-600'];
      if (item.isCustom) {
         rowClasses.push('custom-row');
      } else {
         rowClasses.push('bg-white', 'dark:bg-gray-800');
      }
      if (isSelected) {
         rowClasses.push('selected-row');
      }

      const customIcon = item.isCustom ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="inline-block ml-2 text-blue-600 dark:text-blue-300" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>` : '';
      const highlightedName = highlightText(item.name, searchTerm);
      const highlightedNsn = highlightText(item.nsn, searchTerm);
      const highlightedNiin = highlightText(item.niin, searchTerm);

      return `
            <tr class="${rowClasses.join(' ')}" data-id="${item.id}">
                <td class="px-6 py-4 text-center" data-label="Select">
                    <input type="checkbox" class="row-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${escapeHTML(item.name)}">
                </td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white text-left" data-label="Name">${highlightedName}${customIcon}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center expandable" data-label="NSN">${highlightedNsn || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center expandable" data-label="NIIN">${highlightedNiin || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center radionuclide-link text-blue-500 hover:underline cursor-pointer" data-label="Radionuclide" data-radionuclide="${item.radionuclide}">${item.radionuclide}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap" data-label="Activity">${activity}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap expandable" data-label="NRC Exemption">${nrcExemption}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap expandable" data-label="DOT Exemption">${dotExemption}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap expandable" data-label="UN 2911 Limit (item)">${un2911Limit}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap expandable" data-label="UN 2911 Limit (package)">${un2911PkgLimit}</td>
                <td class="toggle-cell"><button class="details-toggle-btn">Show More</button></td>
            </tr>`;
   }).join('');

   tableBody.innerHTML = rows;
   updatePaginationControls(totalItems, startIdx + 1, Math.min(endIdx, totalItems));
}

// Updates the Previous/Next buttons
function updatePaginationControls(totalItems, start, end) {
   const infoSpan = document.getElementById('paginationInfo');
   const prevBtn = document.getElementById('prevPageBtn');
   const nextBtn = document.getElementById('nextPageBtn');
   const totalPages = Math.ceil(totalItems / itemsPerPage);

   infoSpan.textContent = `Showing ${start} to ${end} of ${totalItems} entries`;

   prevBtn.disabled = currentPage === 1;
   nextBtn.disabled = currentPage === totalPages;

   // Remove old listeners to prevent duplicates (cloning is a quick hack for this)
   const newPrev = prevBtn.cloneNode(true);
   const newNext = nextBtn.cloneNode(true);
   prevBtn.parentNode.replaceChild(newPrev, prevBtn);
   nextBtn.parentNode.replaceChild(newNext, nextBtn);

   newPrev.addEventListener('click', () => {
      if (currentPage > 1) {
         currentPage--;
         // We need to re-run sort/filter to get the data again, 
         // OR simpler: re-call performSort which calls getFilteredData
         performSort();
         document.querySelector('.overflow-x-auto').scrollTop = 0; // Scroll to top
      }
   });

   newNext.addEventListener('click', () => {
      if (currentPage < totalPages) {
         currentPage++;
         performSort();
         document.querySelector('.overflow-x-auto').scrollTop = 0;
      }
   });
}

function performSort() {
   const filteredData = getFilteredData();
   filteredData.sort((a, b) => {
      let valA = a[currentSort.column];
      let valB = b[currentSort.column];
      if (valA === null) return 1;
      if (valB === null) return -1;
      let comparison = 0;
      if (typeof valA === 'string') {
         comparison = valA.localeCompare(valB, undefined, {
            numeric: true
         });
      } else {
         if (valA > valB) comparison = 1;
         else if (valA < valB) comparison = -1;
      }
      return currentSort.direction === 'asc' ? comparison : -comparison;
   });
   updateSortArrows();
   populateTable(filteredData);
}

function sortTable(columnKey) {
   const isSameColumn = currentSort.column === columnKey;
   if (isSameColumn) {
      currentSort.direction = (currentSort.direction === 'asc') ? 'desc' : 'asc';
   } else {
      currentSort.direction = 'asc';
   }
   currentSort.column = columnKey;
   performSort();
   saveState();
}

function updateSortArrows() {
   document.querySelectorAll('.sortable').forEach(th => {
      th.classList.remove('sorted-column');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) {
         arrow.classList.remove('asc', 'desc');
      }
   });
   const header = document.querySelector(`th[onclick="sortTable('${currentSort.column}')"]`);
   if (header) {
      header.classList.add('sorted-column');
      const arrow = header.querySelector('.sort-arrow');
      if (arrow) {
         arrow.classList.add(currentSort.direction);
      }
   }
}

function getFilteredData() {
   const searchInput = document.getElementById("searchInput");
   const textFilter = searchInput.value.toUpperCase();

   // Create a "clean" version of the search term (remove hyphens and spaces)
   // This allows matching "123456789" against "12-34-56-789"
   const cleanFilter = textFilter.replace(/[-\s]/g, '');

   const radionuclideFilter = document.getElementById('radionuclideFilter');
   const nuclideFilter = radionuclideFilter.value;
   const nrcExemptOnly = document.getElementById('nrcExemptFilter').checked;
   const dotExemptOnly = document.getElementById('dotExemptFilter').checked;

   return tableData.filter(item => {
      const nuclideMatch = nuclideFilter === 'all' || item.radionuclide === nuclideFilter;
      const nrcExemptMatch = !nrcExemptOnly || (item.nrc_exemption_val !== null && item.activity_val <= item.nrc_exemption_val);
      const dotExemptMatch = !dotExemptOnly || (item.dot_exemption_val !== null && item.activity_val <= item.dot_exemption_val);

      let textMatch = false;
      if (textFilter === "") {
         textMatch = true;
      } else {
         // 1. Check Name normally (using the original textFilter so spaces/hyphens in names still matter)
         const nameMatch = item.name && item.name.toUpperCase().includes(textFilter);

         // 2. Check NSN: Strip hyphens/spaces from the item's NSN data, compare to clean search term
         const nsnClean = item.nsn ? item.nsn.replace(/[-\s]/g, '') : '';
         const nsnMatch = nsnClean.includes(cleanFilter);

         // 3. Check NIIN: Compare cleaned NIIN data to cleaned search term
         const niinClean = item.niin ? item.niin.replace(/[-\s]/g, '') : '';
         const niinMatch = niinClean.includes(cleanFilter);

         textMatch = nameMatch || nsnMatch || niinMatch;
      }
      return nuclideMatch && textMatch && nrcExemptMatch && dotExemptMatch;
   });
}

function filterTable() {
   currentPage = 1;
   const filteredData = getFilteredData();
   const noResultsDiv = document.getElementById("noResults");
   const selectAllCheckbox = document.getElementById('selectAllCheckbox');
   populateTable(filteredData);
   if (filteredData.length === 0) {
      noResultsDiv.innerHTML = `<p class="font-semibold">No results found.</p><p class="mt-2 text-sm">Try adjusting your search term or clearing some filters.</p>`;
      noResultsDiv.style.display = 'block';
      selectAllCheckbox.checked = false;
      selectAllCheckbox.disabled = true;
   } else {
      noResultsDiv.style.display = 'none';
      selectAllCheckbox.disabled = false;
   }
   updateSelectionState();
}

function updateSelectionState() {
   const allVisibleCheckboxes = document.querySelectorAll('#lookupTable tbody tr .row-checkbox');
   const allVisibleChecked = Array.from(allVisibleCheckboxes).every(cb => cb.checked);
   document.getElementById('selectAllCheckbox').checked = allVisibleCheckboxes.length > 0 && allVisibleChecked;
}

function debounce(func, delay) {
   let timeout;
   return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
   };
}

function showToast(message, type = 'info') {
   const container = document.getElementById('toastContainer');
   const toast = document.createElement('div');
   toast.className = `toast ${type}`;
   toast.textContent = message;
   container.appendChild(toast);
   setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => {
         toast.remove();
      });
   }, 3000);
}

function exportDisposalRequestAsCSV() {
   const form = document.getElementById('disposalRequestForm');
   if (!form) return;
   const escapeCsvCell = (cell) => {
      if (cell === null || typeof cell === 'undefined') return '""';
      let str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
         str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
   };
   const pocs = [];
   const pocCards = form.querySelectorAll('.poc-card');
   pocCards.forEach((card, index) => {
      const pocNumber = index + 1;
      const getValue = (field) => card.querySelector(`[data-form-id="poc${pocNumber}${field}"]`)?.value || '';
      pocs.push({
         name: getValue('Name'),
         title: getValue('Title'),
         email: getValue('Email'),
         businessPhone: getValue('BusinessPhone'),
         mobilePhone: getValue('MobilePhone')
      });
   });
   const staticHeadersStart = [
      'UIC', 'Command Name', 'Street Address', 'City', 'State', 'Zip', 'Country'
   ];
   const pocHeaders = [];
   pocs.forEach((poc, index) => {
      const pocNumber = index + 1;
      pocHeaders.push(
         `POC ${pocNumber} Name`, `POC ${pocNumber} Title`, `POC ${pocNumber} Email`,
         `POC ${pocNumber} Business #`, `POC ${pocNumber} Mobile #`
      );
   });
   const staticHeadersEnd = [
      'Security Requirements', 'Pickup Address', 'Pickup Building',
      'Item Name', 'NSN', 'Quantity', 'Serial #(s)', 'DEMIL', 'SSDR', 'Radionuclide', 'Activity (Ci)', 'Assay Date',
      'Licensed', 'License/Permit #', 'Form', 'Volume', 'Weight', 'Other Info',
      'Mfg. Name', 'Mfg. Model', 'Mfg. Date'
   ];
   const headers = [...staticHeadersStart, ...pocHeaders, ...staticHeadersEnd];
   let csvString = headers.map(escapeCsvCell).join(",") + "\n";
   const itemCards = form.querySelectorAll('.disposal-item');
   itemCards.forEach(itemCard => {
      const itemId = itemCard.dataset.itemId;
      const itemData = tableData.find(d => d.id == itemId);
      const getFieldValue = (id) => itemCard.querySelector(`[data-form-id="${id}"]`)?.value || '';
      const serialInputs = itemCard.querySelectorAll('[data-form-id="serial"]');
      const serials = Array.from(serialInputs).map(input => input.value).filter(val => val).join('; ');
      const staticRowDataStart = [
         form.querySelector('[data-form-id="uic"]').value, form.querySelector('[data-form-id="commandName"]').value,
         form.querySelector('[data-form-id="streetAddress"]').value, form.querySelector('[data-form-id="city"]').value,
         form.querySelector('[data-form-id="state"]').value, form.querySelector('[data-form-id="zip"]').value,
         form.querySelector('[data-form-id="country"]').value
      ];
      const pocRowData = [];
      pocs.forEach(poc => {
         pocRowData.push(poc.name, poc.title, poc.email, poc.businessPhone, poc.mobilePhone);
      });
      const staticRowDataEnd = [
         form.querySelector('[data-form-id="security"]').value,
         form.querySelector('[data-form-id="pickupAddress"]').value, form.querySelector('[data-form-id="pickupBuilding"]').value,
         itemData.name, itemData.nsn, getFieldValue('quantity'), serials, getFieldValue('demil'), getFieldValue('ssdr'),
         itemData.radionuclide, itemData.activity_ci_str, getFieldValue('assayDate'), getFieldValue('licensed'),
         getFieldValue('licenseNumber'), getFieldValue('form'), getFieldValue('volume'), getFieldValue('weight'),
         getFieldValue('otherInfo'), getFieldValue('mfgName'), getFieldValue('mfgModel'), getFieldValue('mfgDate')
      ];
      const rowData = [...staticRowDataStart, ...pocRowData, ...staticRowDataEnd];
      csvString += rowData.map(escapeCsvCell).join(",") + "\n";
   });
   const blob = new Blob([csvString], {
      type: 'text/csv;charset=utf-8;'
   });
   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");
   link.setAttribute("href", url);
   link.setAttribute("download", "disposal_request.csv");
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
   showToast('Disposal request exported as CSV!', 'success');
}

// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
   // Element selectors
   const darkModeToggle = document.getElementById('darkModeToggle');
   const unitToggle = document.getElementById('unitToggle');
   const tableBody = document.querySelector('#lookupTable tbody');
   const compareBtn = document.getElementById('compareBtn');
   const exportSelectionBtn = document.getElementById('exportSelectionBtn');
   const clearSelectionBtn = document.getElementById('clearSelectionBtn');
   const disposalRequestBtn = document.getElementById('disposalRequestBtn');
   const compareModal = document.getElementById('compareModal');
   const closeModalBtn = document.getElementById('closeModalBtn');
   const compareContent = document.getElementById('compareContent');
   const detailModal = document.getElementById('detailModal');
   const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
   const detailContent = document.getElementById('detailContent');
   const detailActions = document.getElementById('detailActions');
   const detailModalTitle = document.getElementById('detailModalTitle');
   const radionuclideFilter = document.getElementById('radionuclideFilter');
   const disposalRequestModal = document.getElementById('disposalRequestModal');
   const closeDisposalRequestModalBtn = document.getElementById('closeDisposalRequestModalBtn');
   const disposalRequestContent = document.getElementById('disposalRequestContent');
   const nrcExemptFilter = document.getElementById('nrcExemptFilter');
   const dotExemptFilter = document.getElementById('dotExemptFilter');
   const helpBtn = document.getElementById('helpBtn');
   const helpModal = document.getElementById('helpModal');
   const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
   const saveSelectionBtn = document.getElementById('saveSelectionBtn');
   const loadSelectionBtn = document.getElementById('loadSelectionBtn');
   const selectAllCheckbox = document.getElementById('selectAllCheckbox');
   const clearSavedBtn = document.getElementById('clearSavedBtn');
   const addItemBtn = document.getElementById('addItemBtn');
   const addItemModal = document.getElementById('addItemModal');
   const closeAddItemModalBtn = document.getElementById('closeAddItemModalBtn');
   const cancelAddItemBtn = document.getElementById('cancelAddItemBtn');
   const addItemForm = document.getElementById('addItemForm');
   const itemRadionuclideSelect = document.getElementById('itemRadionuclide');
   const clearAddedBtn = document.getElementById('clearAddedBtn');
   const importCustomBtn = document.getElementById('importCustomBtn');
   const exportCustomBtn = document.getElementById('exportCustomBtn');
   const importFileInput = document.getElementById('importFileInput');
   const searchInput = document.getElementById('searchInput');
   const clearFiltersBtn = document.getElementById('clearFiltersBtn');
   const radionuclideDetailModal = document.getElementById('radionuclideDetailModal');
   const closeRadionuclideModalBtn = document.getElementById('closeRadionuclideModalBtn');
   const tooltipModal = document.getElementById('tooltipModal');
   const closeTooltipModalBtn = document.getElementById('closeTooltipModalBtn');
   const clearSearchBtn = document.getElementById('clearSearchBtn');
   const exportCsvBtn = document.getElementById('exportCsvBtn');
   const printRequestBtn = document.getElementById('printRequestBtn');
   const generateMemoBtn = document.getElementById('generateMemoBtn');
   const memoModal = document.getElementById('memoModal');
   const closeMemoModalBtn = document.getElementById('closeMemoModalBtn');
   const copyMemoBtn = document.getElementById('copyMemoBtn');
   const memoContent = document.getElementById('memoContent');
   const instructionsModal = document.getElementById('instructionsModal');
   const showInstructionsBtn = document.getElementById('showInstructionsBtn');
   const closeInstructionsModalBtn = document.getElementById('closeInstructionsModalBtn');
   const confirmModal = document.getElementById('confirmModal');
   const confirmModalText = document.getElementById('confirmModalText');
   const confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');
   const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
   const allModals = [compareModal, detailModal, disposalRequestModal, helpModal, addItemModal, confirmModal, radionuclideDetailModal, tooltipModal, memoModal, instructionsModal];

   // State for accessibility and modals
   let removeCurrentFocusTrap = null;
   let confirmCallback = null;
   let focusedElementBeforeModal = null;

   // Centralized Modal Functions with Focus Management
   function openModal(modalElement) {
      focusedElementBeforeModal = document.activeElement;
      modalElement.style.display = 'flex';
      removeCurrentFocusTrap = activateFocusTrap(modalElement);
   }

   function closeModal(modalElement) {
      if (typeof removeCurrentFocusTrap === 'function') {
         removeCurrentFocusTrap();
         removeCurrentFocusTrap = null;
      }
      modalElement.style.display = 'none';
      if (focusedElementBeforeModal) {
         focusedElementBeforeModal.focus();
      }
   }

   // Dark Mode
   if (safeGetItem('darkMode') === 'enabled') {
      darkModeToggle.checked = true;
   }
   darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
         document.documentElement.classList.add('dark');
         safeSetItem('darkMode', 'enabled');
      } else {
         document.documentElement.classList.remove('dark');
         safeSetItem('darkMode', 'disabled');
      }
   });

   // Table interaction
   tableBody.addEventListener('click', (event) => {
      const toggleBtn = event.target.closest('.details-toggle-btn');
      if (toggleBtn) {
         const row = toggleBtn.closest('tr');
         row.classList.toggle('details-visible');
         toggleBtn.textContent = row.classList.contains('details-visible') ? 'Show Less' : 'Show More';
         return;
      }
      const targetCell = event.target.closest('td');
      if (!targetCell) return;
      if (targetCell.classList.contains('radionuclide-link')) {
         const nuclideId = targetCell.dataset.radionuclide;
         showRadionuclideModal(nuclideId);
         return;
      }
      const row = targetCell.parentElement;
      const checkbox = row.querySelector('.row-checkbox');
      if (targetCell.cellIndex === 0) {
         if (event.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
         }
         const changeEvent = new Event('change', {
            bubbles: true
         });
         checkbox.dispatchEvent(changeEvent);
      } else {
         const itemId = row.dataset.id;
         const item = tableData.find(d => d.id == itemId);
         if (item) {
            showDetailModal(item);
         }
      }
   });

   tableBody.addEventListener('change', (event) => {
      if (event.target.classList.contains('row-checkbox')) {
         const checkbox = event.target;
         const row = checkbox.closest('tr');
         const id = String(checkbox.dataset.id);

         // Sync with Set
         if (checkbox.checked) {
            selectedIds.add(id);
            row.classList.add('selected-row');
         } else {
            selectedIds.delete(id);
            row.classList.remove('selected-row');
         }

         // Count based on Set size, not visible checkboxes
         const selectedCount = selectedIds.size;

         compareBtn.disabled = selectedCount < 2;
         exportSelectionBtn.disabled = selectedCount === 0;
         clearSelectionBtn.disabled = selectedCount === 0;
         disposalRequestBtn.disabled = selectedCount === 0;
         saveSelectionBtn.disabled = selectedCount === 0;

         updateSelectionState();
      }
   });

   // --- Slash (/) to Search ---
   document.addEventListener('keydown', (e) => {
      // Don't trigger if user is already typing in an input
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
         e.preventDefault(); // Prevent the '/' character from being typed
         searchInput.focus();
      }
   });

   // --- Export Filtered Results ---
   const exportFilteredBtn = document.getElementById('exportFilteredBtn');
   if (exportFilteredBtn) {
      exportFilteredBtn.addEventListener('click', () => {
         const currentData = getFilteredData();
         if (currentData.length === 0) {
            showToast('No items to export.', 'error');
            return;
         }

         const headers = ['Name', 'NSN', 'Radionuclide', 'Activity (Ci)', 'NRC Limit', 'DOT Limit'];
         const escape = (text) => text ? `"${String(text).replace(/"/g, '""')}"` : '""';

         let csvContent = headers.join(',') + "\n";

         currentData.forEach(item => {
            const row = [
               item.name,
               item.nsn,
               item.radionuclide,
               item.activity_val, // This is always in Ci
               // item.units column removed
               item.nrc_exemption_ci_str,
               item.dot_exemption_ci_str
            ];
            csvContent += row.map(escape).join(',') + "\n";
         });

         const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
         });
         const url = URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.setAttribute("href", url);
         link.setAttribute("download", "search_results.csv");
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         showToast(`Exported ${currentData.length} items.`, 'success');
      });
   }

   function copyToClipboard(text, buttonElement) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
         document.execCommand('copy');
         showToast('Copied to clipboard!', 'success');
         if (buttonElement) {
            const clipboardIcon = buttonElement.querySelector('.clipboard-icon');
            const checkmarkIcon = buttonElement.querySelector('.checkmark-icon');
            if (clipboardIcon && checkmarkIcon) {
               clipboardIcon.style.display = 'none';
               checkmarkIcon.style.display = 'inline-block';
               setTimeout(() => {
                  clipboardIcon.style.display = 'inline-block';
                  checkmarkIcon.style.display = 'none';
               }, 1500);
            }
         }
      } catch (err) {
         console.error('Failed to copy text: ', err);
         showToast('Failed to copy!', 'error');
      }
      document.body.removeChild(textarea);
   }

   // Modal Functions
   function showDetailModal(item) {
      const isSiUnits = unitToggle.checked;
      detailModalTitle.textContent = item.name;
      const copyButtonHTML = (copyText) => `
                    <button data-copy="${copyText || ''}" class="copy-btn ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Copy">
                        <svg class="clipboard-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5-.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 7a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15A.5.5 0 0 1-1 7z"/></svg>
                        <svg class="checkmark-icon w-4 h-4 text-green-500 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                    </button>`;
      let content = `<div class="space-y-4">`;
      content += `<div class="flex justify-between items-center"><strong>NSN:</strong> <span>${escapeHTML(item.nsn || 'N/A')} ${copyButtonHTML(item.nsn)}</span></div>`;
      content += `<div class="flex justify-between items-center"><strong>NIIN:</strong> <span>${escapeHTML(item.niin || 'N/A')} ${copyButtonHTML(item.niin)}</span></div>`;
      if (item.nsn) {
         content += `<div><a href="https://www.iso-group.com/NSN/${item.nsn}" target="_blank" class="text-blue-500 hover:underline">Lookup via ISO-Group</a></div>`;
      }
      content += `<hr class="dark:border-gray-600 my-4">`;
      content += `<div class="mb-4"><strong>Activity:</strong> ${isSiUnits ? item.activity_bq_str : item.activity_ci_str} of <span class="radionuclide-link text-blue-500 hover:underline cursor-pointer" data-radionuclide="${item.radionuclide}">${item.radionuclide}</span></div>`;
      const comparisons = [{
            key: 'nrc_exemption_val',
            label: 'NRC Exemption',
            limit: item.nrc_exemption_val,
            str: isSiUnits ? item.nrc_exemption_bq_str : item.nrc_exemption_ci_str
         },
         {
            key: 'dot_exemption_val',
            label: 'DOT Exemption',
            limit: item.dot_exemption_val,
            str: isSiUnits ? item.dot_exemption_bq_str : item.dot_exemption_ci_str
         },
         {
            key: 'un2911_limit_val',
            label: 'UN 2911 Limit (item)',
            limit: item.un2911_limit_val,
            str: isSiUnits ? item.un2911_limit_bq_str : item.un2911_limit_ci_str
         },
         {
            key: 'un2911_pkg_limit_val',
            label: 'UN 2911 Limit (package)',
            limit: item.un2911_pkg_limit_val,
            str: isSiUnits ? item.un2911_pkg_limit_bq_str : item.un2911_pkg_limit_ci_str
         }
      ];
      comparisons.forEach(comp => {
         let status, statusColor, percentage = 0;
         if (item.activity_val === null || comp.limit === null) {
            status = 'N/A';
            statusColor = 'text-gray-500';
         } else if (item.activity_val > comp.limit) {
            status = 'ABOVE';
            statusColor = 'text-red-500';
         } else {
            status = 'BELOW';
            statusColor = 'text-green-500';
         }
         if (item.activity_val !== null && comp.limit !== null && comp.limit > 0) {
            percentage = Math.min((item.activity_val / comp.limit) * 100, 100);
         }
         content += `<div class="mb-3">`;
         content += `<div class="flex justify-between items-center">
                                    <span class="flex items-center">
                                        ${comp.label}: ${comp.str}
                                        <svg data-tooltip-key="${comp.key}" class="tooltip-icon ml-2 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>
                                    </span> 
                                    <span class="font-bold ${statusColor}">${status}</span>
                                </div>`;
         if (status !== 'N/A') {
            const barColor = statusColor.replace('text-', 'bg-');
            content += `
                            <div class="progress-bar-container">
                                <div class="progress-bar ${barColor}" style="width: ${percentage}%;">
                                    ${percentage.toFixed(0)}%
                                </div>
                            </div>`;
         }
         content += `</div>`;
      });
      content += `</div>`;
      detailContent.innerHTML = content;
      const nuclideLink = detailContent.querySelector('.radionuclide-link');
      if (nuclideLink) {
         nuclideLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const nuclideId = e.target.dataset.radionuclide;
            showRadionuclideModal(nuclideId);
         });
      }
      detailContent.querySelectorAll('.copy-btn').forEach(button => {
         button.addEventListener('click', (e) => {
            e.stopPropagation();
            const textToCopy = button.dataset.copy;
            if (textToCopy) {
               copyToClipboard(textToCopy, button);
            }
         });
      });
      detailContent.querySelectorAll('.tooltip-icon').forEach(icon => {
         icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const tooltipKey = e.currentTarget.dataset.tooltipKey;
            showTooltipModal(tooltipKey);
         });
      });
      detailActions.innerHTML = '';
      const addToPackageBtn = document.createElement('button');
      const checkbox = document.querySelector(`.row-checkbox[data-id="${item.id}"]`);

      function updateAddToPackageButtonState() {
         if (checkbox && checkbox.checked) {
            addToPackageBtn.textContent = 'Remove from Package';
            addToPackageBtn.className = 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600';
         } else {
            addToPackageBtn.textContent = 'Add to Package';
            addToPackageBtn.className = 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600';
         }
      }
      updateAddToPackageButtonState();
      addToPackageBtn.onclick = (e) => {
         e.stopPropagation();
         if (checkbox) {
            checkbox.checked = !checkbox.checked;
            const changeEvent = new Event('change', {
               bubbles: true
            });
            checkbox.dispatchEvent(changeEvent);
            updateAddToPackageButtonState();
         }
      };
      detailActions.appendChild(addToPackageBtn);
      const customActionsContainer = document.createElement('div');
      customActionsContainer.className = 'flex gap-4';
      if (item.isCustom) {
         const editBtn = document.createElement('button');
         editBtn.textContent = 'Edit';
         editBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600';
         editBtn.onclick = () => {
            closeModal(detailModal);
            showAddItemModal(item);
         };
         const deleteBtn = document.createElement('button');
         deleteBtn.textContent = 'Delete';
         deleteBtn.className = 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600';
         deleteBtn.onclick = () => {
            showConfirmationModal(`Are you sure you want to delete the item "${item.name}"?`, () => {
               closeModal(detailModal);
               deleteCustomItem(item.id);
            });
         };
         customActionsContainer.appendChild(editBtn);
         customActionsContainer.appendChild(deleteBtn);
      }
      detailActions.appendChild(customActionsContainer);
      openModal(detailModal);
   }
   compareBtn.addEventListener('click', () => {
      // Use the global Set to find items, ensuring off-screen selections are included
      const selectedData = Array.from(selectedIds).map(id => tableData.find(d => String(d.id) === String(id))).filter(Boolean);

      const isSiUnits = unitToggle.checked;
      let content = '<div class="overflow-x-auto"><table class="w-full text-sm text-left">';
      const headers = ['Attribute', ...selectedData.map(item => escapeHTML(item.name))];
      content += '<thead><tr class="bg-gray-100 dark:bg-gray-700">';
      headers.forEach(header => content += `<th class="px-4 py-2">${header}</th>`);
      content += '</tr></thead><tbody>';
      const attributes = [{
            label: 'NSN',
            key: 'nsn'
         }, {
            label: 'NIIN',
            key: 'niin'
         },
         {
            label: 'Radionuclide',
            key: 'radionuclide'
         },
         {
            label: 'Activity',
            key: isSiUnits ? 'activity_bq_str' : 'activity_ci_str'
         },
         {
            label: 'NRC Exemption',
            key: isSiUnits ? 'nrc_exemption_bq_str' : 'nrc_exemption_ci_str'
         },
         {
            label: 'DOT Exemption',
            key: isSiUnits ? 'dot_exemption_bq_str' : 'dot_exemption_ci_str'
         },
         {
            label: 'UN 2911 Limit (item)',
            key: isSiUnits ? 'un2911_limit_bq_str' : 'un2911_limit_ci_str'
         },
         {
            label: 'UN 2911 Limit (package)',
            key: isSiUnits ? 'un2911_pkg_limit_bq_str' : 'un2911_pkg_limit_ci_str'
         }
      ];
      attributes.forEach(attr => {
         content += '<tr class="border-b dark:border-gray-700">';
         content += `<td class="px-4 py-2 font-semibold">${attr.label}</td>`;
         selectedData.forEach(item => {
            content += `<td class="px-4 py-2">${escapeHTML(item[attr.key] || '')}</td>`;
         });
         content += '</tr>';
      });
      content += '</tbody></table></div>';
      compareContent.innerHTML = content;
      openModal(compareModal);
   });

   document.getElementById('resetAppBtn').addEventListener('click', () => {
      showConfirmationModal('FACTORY RESET: This will delete all custom items, saved selections, and preferences. Are you sure?', () => {
         localStorage.clear();
         location.reload();
      });
   });

   function createPocHtml(pocNumber) {
      return `
                    <div class="p-4 border rounded-lg dark:border-gray-600 poc-card">
                        <h4 class="font-semibold mb-2">POC ${pocNumber}</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label class="block text-sm font-medium">Name</label><input type="text" data-form-id="poc${pocNumber}Name" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Title</label><input type="text" data-form-id="poc${pocNumber}Title" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">E-mail</label><input type="email" data-form-id="poc${pocNumber}Email" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Business #</label><input type="tel" data-form-id="poc${pocNumber}BusinessPhone" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Mobile #</label><input type="tel" data-form-id="poc${pocNumber}MobilePhone" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                        </div>
                    </div>`;
   }

   function showDisposalRequestModal() {

      const selectedItems = Array.from(selectedIds).map(id => tableData.find(d => String(d.id) === String(id))).filter(Boolean);

      let content = '<form id="disposalRequestForm" class="space-y-6">';
      content += `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                            <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Command Information
                        </summary>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                            <div><label class="block text-sm font-medium">UIC</label><input type="text" data-form-id="uic" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Command Name</label><input type="text" data-form-id="commandName" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div class="md:col-span-2"><label class="block text-sm font-medium">Street Address</label><input type="text" data-form-id="streetAddress" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">City</label><input type="text" data-form-id="city" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">State</label><input type="text" data-form-id="state" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Zip</label><input type="text" data-form-id="zip" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            <div><label class="block text-sm font-medium">Country (if not USA)</label><input type="text" data-form-id="country" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                        </div>
                    </details>`;
      content += `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                            <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Command POCs (at least two!)
                        </summary>
                        <div class="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                                        <div id="pocContainer" class="space-y-4">
                                ${createPocHtml(1)}
                                ${createPocHtml(2)}
                            </div>
                            <button type="button" id="addPocBtn" class="mt-4 text-sm text-blue-600 hover:underline">+ Add another POC</button>
                            <div class="mt-4"><label class="block text-sm font-medium">Facility Security Access Requirements</label><textarea data-form-id="security" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm" rows="2"></textarea></div>
                        </div>
                    </details>`;
      content += `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                            <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Funding Information
                        </summary>
                        <div class="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                            <div>
                                <label class="block text-sm font-medium">Does the command intend to provide funds for this disposal?</label>
					<select data-form-id="funding" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm">
   						 <option value="does">Yes</option>
						  <option value="does not" selected>No</option>
					</select>
                            </div>
                        </div>
                    </details>`;
      content += `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                            <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Item Details
                        </summary>
                        <div id="disposalItemsContainer" class="border-l-2 border-gray-200 dark:border-gray-600 pl-4 space-y-4">`;
      selectedItems.forEach((item, index) => {
         content += `
			    <div class="p-4 border rounded-lg dark:border-gray-600 disposal-item" data-item-id="${item.id}">
			        <h4 class="font-semibold mb-2 text-base">${escapeHTML(item.name)}</h4>
			        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label class="block text-sm font-medium">NSN</label><input type="text" value="${item.nsn || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm" readonly></div>
                                <div><label class="block text-sm font-medium">DEMIL</label><input type="text" data-form-id="demil" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div class="md:col-span-2"><label class="block text-sm font-medium">Serial #(s)</label><div class="serial-number-container space-y-2"><input type="text" data-form-id="serial" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div></div>
                                <div><label class="block text-sm font-medium">SSDR</label><input type="text" data-form-id="ssdr" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium"># each</label><input type="number" value="1" min="1" data-form-id="quantity" class="quantity-input mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Radionuclide</label><input type="text" value="${item.radionuclide}" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm" readonly></div>
                                <div><label class="block text-sm font-medium">Activity</label><input type="text" value="${item.activity_ci_str}" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm" readonly></div>
                                <div><label class="block text-sm font-medium">Assay Date</label><input type="date" data-form-id="assayDate" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Licensed</label><select data-form-id="licensed" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"><option>No</option><option>Yes</option></select></div>
                                <div class="md:col-span-2"><label class="block text-sm font-medium">NRC License # / MML Permit #</label><input type="text" data-form-id="licenseNumber" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Form (i.e. Normal/Special/unknown)</label><input type="text" data-form-id="form" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Volume</label><input type="text" data-form-id="volume" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Weight</label><input type="text" data-form-id="weight" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div class="md:col-span-3"><label class="block text-sm font-medium">Other Info</label><input type="text" data-form-id="otherInfo" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div class="md:col-span-3"><label class="block text-sm font-medium">Pictures</label><div class="picture-container space-y-2"><input type="file" data-form-id="picture" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"></div><button type="button" class="add-picture-btn mt-2 text-sm text-blue-600 hover:underline">+ Add another picture</button></div>
                                <div><label class="block text-sm font-medium">Company Name</label><input type="text" data-form-id="mfgName" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Part/Model #</label><input type="text" data-form-id="mfgModel" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Date (on item)</label><input type="text" data-form-id="mfgDate" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
				</div>
                        </div>`;
      });
      content += `</div></details>`;
      content += `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                             <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Pickup Location
                        </summary>
                        <div class="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                            <div class="mb-4">
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" id="copyCommandInfoBtn" class="form-checkbox h-4 w-4 text-blue-600 rounded">
                                    <span class="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                        Use Command Address
                                    </span>
                                </label>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="md:col-span-2"><label class="block text-sm font-medium">Address</label><input type="text" data-form-id="pickupAddress" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                                <div><label class="block text-sm font-medium">Building #</label><input type="text" data-form-id="pickupBuilding" class="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm"></div>
                            </div>
                        </div>
                    </details>`;
      content += `<div id="packageAnalysis" class="mt-6"></div>`;
      content += '</form>';
      disposalRequestContent.innerHTML = content;
      openModal(disposalRequestModal);

      const copyBtn = document.getElementById('copyCommandInfoBtn');
      if (copyBtn) {
         copyBtn.addEventListener('change', (e) => {
            if (e.target.checked) {
               const street = disposalRequestContent.querySelector('[data-form-id="streetAddress"]').value;
               const city = disposalRequestContent.querySelector('[data-form-id="city"]').value;
               const state = disposalRequestContent.querySelector('[data-form-id="state"]').value;
               const zip = disposalRequestContent.querySelector('[data-form-id="zip"]').value;

               // Combine them intelligently
               const fullAddr = [street, city, state, zip].filter(Boolean).join(', ');

               const pickupInput = disposalRequestContent.querySelector('[data-form-id="pickupAddress"]');
               pickupInput.value = fullAddr;

               // Optional: Flash the input to show it updated
               pickupInput.classList.add('bg-green-100', 'dark:bg-green-900');
               setTimeout(() => pickupInput.classList.remove('bg-green-100', 'dark:bg-green-900'), 500);
            }
         });
      }

      calculateDisposalPackageAnalysis();
      disposalRequestContent.querySelector('#disposalItemsContainer').addEventListener('input', calculateDisposalPackageAnalysis);
   }

   // 1. Clear Selection Button
   if (clearSelectionBtn) {
      clearSelectionBtn.addEventListener('click', () => {
         selectedIds.clear();
         // Update UI
         const checkboxes = document.querySelectorAll('.row-checkbox');
         checkboxes.forEach(cb => {
            cb.checked = false;
            cb.closest('tr').classList.remove('selected-row');
         });
         updateSelectionState();

         // Disable buttons
         compareBtn.disabled = true;
         exportSelectionBtn.disabled = true;
         clearSelectionBtn.disabled = true;
         disposalRequestBtn.disabled = true;
         saveSelectionBtn.disabled = true;

         showToast('Selection cleared.', 'info');
      });
   }

   // 2. Export Selection Button
   if (exportSelectionBtn) {
      exportSelectionBtn.addEventListener('click', () => {
         const selectedItems = Array.from(selectedIds).map(id => tableData.find(d => d.id == id)).filter(Boolean);
         if (selectedItems.length === 0) return;

         // Header matches data (Activity is in Curies)
         const headers = ['Name', 'NSN', 'Radionuclide', 'Activity (Ci)'];
         const escape = (text) => text ? `"${String(text).replace(/"/g, '""')}"` : '""';
         let csvContent = headers.join(',') + "\n";

         selectedItems.forEach(item => {
            const row = [
               item.name,
               item.nsn,
               item.radionuclide,
               item.activity_val // Value is in Ci
               // Units column removed
            ];
            csvContent += row.map(escape).join(',') + "\n";
         });

         const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
         });
         const url = URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.setAttribute("href", url);
         link.setAttribute("download", "selected_items.csv");
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      });
   }

   disposalRequestContent.addEventListener('input', (e) => {
      if (e.target.classList.contains('quantity-input')) {
         const quantityInput = e.target;
         const itemCard = quantityInput.closest('.disposal-item');
         const serialContainer = itemCard.querySelector('.serial-number-container');
         let targetCount = parseInt(quantityInput.value, 10);
         if (isNaN(targetCount) || targetCount < 1) {
            targetCount = 1;
         }
         const currentFields = serialContainer.querySelectorAll('input[data-form-id="serial"]');
         let currentCount = currentFields.length;
         while (currentCount < targetCount) {
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.dataset.formId = 'serial';
            newInput.className = 'mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 shadow-sm';
            serialContainer.appendChild(newInput);
            currentCount++;
         }
         while (currentCount > targetCount) {
            serialContainer.lastElementChild.remove();
            currentCount--;
         }
      }
   });
   disposalRequestContent.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-picture-btn')) {
         const container = e.target.previousElementSibling;
         const newInput = document.createElement('input');
         newInput.type = 'file';
         newInput.dataset.formId = 'picture';
         newInput.className = 'mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600';
         container.appendChild(newInput);
      }
      if (e.target.id === 'addPocBtn') {
         const pocContainer = document.getElementById('pocContainer');
         const newPocNumber = pocContainer.children.length + 1;
         const newPocCardHtml = createPocHtml(newPocNumber);
         pocContainer.insertAdjacentHTML('beforeend', newPocCardHtml);
      }
   });

   function calculateDisposalPackageAnalysis() {
      const analysisContainer = document.getElementById('packageAnalysis');
      if (!analysisContainer) return;

      const itemCards = document.querySelectorAll('.disposal-item');
      let dotExemptSum = 0;
      let un2911PkgSum = 0;
      let typeASum = 0;
      let anyItemExceeds2911 = false; // Track if any single item fails UN2911

      let analysisDetails = [];

      itemCards.forEach(card => {
         const itemId = card.dataset.itemId;
         const itemData = tableData.find(d => d.id == itemId);
         const quantityInput = card.querySelector('.quantity-input');
         const quantity = quantityInput ? parseFloat(quantityInput.value) : 0;

         if (!itemData || isNaN(quantity) || quantity <= 0) {
            return;
         }

         const totalActivity = itemData.activity_val * quantity;

         // (Check against UN2911 Pkg Limit as a proxy for "is this nuclide in our DB?")
         if (itemData.un2911_pkg_limit_val === null && itemData.name !== 'SIGHT KIT') {
            missingLimitData = true;
         }

         const activityPerItem = itemData.activity_val; // NEW: Track single item activity

         // Check Regulatory Item Limit for UN2911
         let itemStatus2911 = 'OK';
         if (itemData.un2911_limit_val && activityPerItem > itemData.un2911_limit_val) {
            anyItemExceeds2911 = true;
            itemStatus2911 = 'EXCEEDS ITEM LIMIT';
         }

         let detailRow = {
            name: itemData.name,
            qty: quantity,
            activity: formatCi(totalActivity),
            dot: 'N/A',
            un2911: 'N/A',
            typeA: 'N/A',
            itemStatus: itemStatus2911 // NEW: Pass status to table
         };

         if (itemData.dot_exemption_val) {
            const fraction = totalActivity / itemData.dot_exemption_val;
            dotExemptSum += fraction;
            detailRow.dot = fraction.toFixed(3);
         }
         if (itemData.un2911_pkg_limit_val) {
            const fraction = totalActivity / itemData.un2911_pkg_limit_val;
            un2911PkgSum += fraction;
            detailRow.un2911 = fraction.toFixed(3);
         }
         if (itemData.dot_a2_val) {
            const fraction = totalActivity / itemData.dot_a2_val;
            typeASum += fraction;
            detailRow.typeA = fraction.toFixed(3);
         }
         analysisDetails.push(detailRow);
      });

      let classification = '';
      let classificationColor = '';

      if (missingLimitData) {
         classification = '⚠️ CANNOT CALCULATE: Contains radionuclides with unknown limits.';
         classificationColor = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-2 border-red-500';

      } else if (dotExemptSum <= 1) {
         classification = 'Exempt from regulation per 49 CFR § 173.436.';
         classificationColor = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      } else if (un2911PkgSum <= 1 && !anyItemExceeds2911) {
         // Only UN2911 if Package Sum <= 1 AND no single item exceeds item limit
         classification = 'Limited Quantity Excepted Package (UN 2911)';
         classificationColor = 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      } else if (typeASum <= 1) {
         classification = 'Type A Package';
         // Add warning if it was pushed here due to item limit
         if (anyItemExceeds2911 && un2911PkgSum <= 1) {
            classification += ' (Item exceeds UN2911 limit)';
         }
         classificationColor = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      } else {
         classification = 'Exceeds Type A limits. Requires Type B package.';
         classificationColor = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      }

      // Render...
      let content = `
                    <details class="group" open>
                        <summary class="text-lg font-semibold cursor-pointer list-none group-open:mb-4">
                            <span class="group-open:hidden">►</span><span class="hidden group-open:inline">▼</span> Package Analysis
                        </summary>
                        <div class="border-l-2 border-gray-200 dark:border-gray-600 pl-4 space-y-4">
                            <div class="p-4 rounded-lg ${classificationColor}">
                                <h4 class="font-bold">Package Classification:</h4>
                                <p>${classification}</p>
                            </div>
                            <div>
                                <h4 class="font-semibold mb-2">Sum of Fractions Calculation:</h4>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm text-left">
                                        <thead class="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th class="px-2 py-1">Item</th>
                                                <th class="px-2 py-1 text-center">Qty</th>
                                                <th class="px-2 py-1 text-center">Total Act.</th>
                                                <th class="px-2 py-1 text-center">Exempt Frac.</th>
                                                <th class="px-2 py-1 text-center">UN 2911 Frac.</th>
                                                <th class="px-2 py-1 text-center">Type A Frac.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${analysisDetails.map(row => `
                                                <tr class="border-b dark:border-gray-700">
                                                    <td class="px-2 py-1">
                                                        ${row.name}
                                                        ${row.itemStatus !== 'OK' ? '<br><span class="text-xs text-red-500 font-bold">(' + row.itemStatus + ')</span>' : ''}
                                                    </td>
                                                    <td class="px-2 py-1 text-center">${row.qty}</td>
                                                    <td class="px-2 py-1 text-center">${row.activity}</td>
                                                    <td class="px-2 py-1 text-center">${row.dot}</td>
                                                    <td class="px-2 py-1 text-center">${row.un2911}</td>
                                                    <td class="px-2 py-1 text-center">${row.typeA}</td>
                                                </tr>`).join('')}
                                            <tr class="font-bold bg-gray-50 dark:bg-gray-800">
                                                <td class="px-2 py-1 text-right" colspan="3">Total Sum of Fractions:</td>
                                                <td class="px-2 py-1 text-center ${dotExemptSum > 1 ? 'text-red-500' : 'text-green-500'}">${dotExemptSum.toFixed(3)}</td>
                                                <td class="px-2 py-1 text-center ${un2911PkgSum > 1 ? 'text-red-500' : 'text-green-500'}">${un2911PkgSum.toFixed(3)}</td>
                                                <td class="px-2 py-1 text-center ${typeASum > 1 ? 'text-red-500' : 'text-green-500'}">${typeASum.toFixed(3)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </details>`;
      analysisContainer.innerHTML = content;
   }

   printRequestBtn.addEventListener('click', async () => {
      const form = document.getElementById('disposalRequestForm');
      const getValue = (id) => {
         const el = form.querySelector(`[data-form-id="${id}"]`);
         return el ? el.value : 'N/A';
      };
      const formatDate = (dateStr) => {
         if (!dateStr || dateStr === 'N/A') return 'N/A';
         try {
            // Append T12:00:00 to prevent timezone shifts
            const date = new Date(dateStr + 'T12:00:00');
            return date.toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'long',
               day: 'numeric'
            });
         } catch (e) {
            return dateStr;
         }
      };
      const readFileAsDataURL = (file) => {
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
         });
      };
      const analysisContentHTML = document.getElementById('packageAnalysis').innerHTML;
      let printContent = `
                    <html><head><title>Disposal Request</title><script src="https://cdn.tailwindcss.com"><\/script>
                    <style>
                        body { font-family: "Inter", sans-serif; padding: 2rem; } h1, h2, h3 { font-weight: bold; margin-bottom: 0.5rem; margin-top: 1rem; }
                        h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
                        h3 { font-size: 1.1rem; } .section { margin-bottom: 1.5rem; page-break-inside: avoid; }
                        .grid-print { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
                        .grid-item { display: flex; flex-direction: column; } .grid-item strong { font-weight: 600; font-size: 0.875rem; color: #555; }
                        .item-card { border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; page-break-inside: avoid; }
                        .item-image { max-width: 100%; height: auto; margin-top: 1rem; border-radius: 0.25rem; }
                        .group[open] .group-open\\:mb-4 { margin-bottom: 1rem; } .list-none { list-style-type: none; }
                        .cursor-pointer { cursor: pointer; } .group .group-open\\:hidden { display: inline; }
                        .group[open] .group-open\\:hidden { display: none; } .group .hidden { display: none; }
                        .group[open] .hidden { display: inline; } .border-l-2 { border-left-width: 2px; } .pl-4 { padding-left: 1rem; }
                        .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; } .p-4 { padding: 1rem; }
                        .rounded-lg { border-radius: 0.5rem; } .bg-green-100 { background-color: #dcfce7; } .text-green-800 { color: #166534; }
                        .bg-blue-100 { background-color: #dbeafe; } .text-blue-800 { color: #1e40af; } .bg-yellow-100 { background-color: #fef08a; }
                        .text-yellow-800 { color: #854d0e; } .bg-red-100 { background-color: #fee2e2; } .text-red-800 { color: #991b1b; }
                        .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; } .mb-2 { margin-bottom: 0.5rem; }
                        .overflow-x-auto { overflow-x: auto; } .w-full { width: 100%; } .text-sm { font-size: 0.875rem; }
                        .text-left { text-align: left; } thead { display: table-header-group; } .bg-gray-100 { background-color: #f3f4f6; }
                        th, td { padding: 0.5rem; } .text-center { text-align: center; } tbody { display: table-row-group; }
                        .border-b { border-bottom-width: 1px; border-color: #e5e7eb; } .bg-gray-50 { background-color: #f9fafb; }
                        .text-right { text-align: right; } .text-red-500 { color: #ef4444; } .text-green-500 { color: #22c55e; }
                    </style></head><body><h1>LLRW Disposal Request</h1>
                        <div class="section"><h2>Command Information</h2><div class="grid-print">
                            <div class="grid-item"><strong>UIC:</strong> <span>${getValue('uic')}</span></div>
                            <div class="grid-item"><strong>Command Name:</strong> <span>${getValue('commandName')}</span></div>
                            <div class="grid-item"><strong>Street Address:</strong> <span>${getValue('streetAddress')}</span></div>
                            <div class="grid-item"><strong>City:</strong> <span>${getValue('city')}</span></div>
                            <div class="grid-item"><strong>State:</strong> <span>${getValue('state')}</span></div>
                            <div class="grid-item"><strong>Zip:</strong> <span>${getValue('zip')}</span></div>
                            <div class="grid-item"><strong>Country:</strong> <span>${getValue('country')}</span></div>
                        </div></div>`;
      printContent += `<div class="section"><h2>Command POCs</h2>`;
      const pocCards = form.querySelectorAll('.poc-card');
      pocCards.forEach((card, index) => {
         const pocNumber = index + 1;
         const getPocValue = (field) => card.querySelector(`[data-form-id="poc${pocNumber}${field}"]`)?.value || 'N/A';
         printContent += `
                        <h3 class="mt-4">POC ${pocNumber}</h3>
                        <div class="grid-print">
                            <div class="grid-item"><strong>Name:</strong> <span>${getPocValue('Name')}</span></div>
                            <div class="grid-item"><strong>Title:</strong> <span>${getPocValue('Title')}</span></div>
                            <div class="grid-item"><strong>E-mail:</strong> <span>${getPocValue('Email')}</span></div>
                            <div class="grid-item"><strong>Business #:</strong> <span>${getPocValue('BusinessPhone')}</span></div>
                            <div class="grid-item"><strong>Mobile #:</strong> <span>${getPocValue('MobilePhone')}</span></div>
                        </div>`;
      });
      printContent += `<div class="grid-item mt-4"><strong>Facility Security Access Requirements:</strong> <span>${getValue('security')}</span></div></div>`;
      printContent += `<div class="section"><h2>Item Details</h2>`;
      const imagePromises = [];
      const itemCards = form.querySelectorAll('.disposal-item');
      itemCards.forEach((itemCard, index) => {
         const itemId = itemCard.dataset.itemId;
         const itemData = tableData.find(d => d.id == itemId);
         const getItemValue = (id) => {
            const el = itemCard.querySelector(`[data-form-id="${id}"]`);
            return el ? el.value : 'N/A';
         };
         const serialInputs = itemCard.querySelectorAll('[data-form-id="serial"]');
         const serials = Array.from(serialInputs).map(input => input.value).filter(val => val).join(', ');
         const fileInputs = itemCard.querySelectorAll('input[type="file"]');
         fileInputs.forEach(input => {
            if (input.files[0]) {
               imagePromises.push(readFileAsDataURL(input.files[0]).then(imageDataUrl => ({
                  name: itemData.name,
                  url: imageDataUrl
               })));
            }
         });
         printContent += `
                        <div class="item-card"><h3>Item ${index + 1}: ${escapeHTML(itemData.name)}</h3><div class="grid-print">
                            <div class="grid-item"><strong>NSN:</strong> <span>${escapeHTML(itemData.nsn || 'N/A')}</span></div>
                            <div class="grid-item"><strong># each:</strong> <span>${getItemValue('quantity')}</span></div>
                            <div class="grid-item"><strong>DEMIL:</strong> <span>${getItemValue('demil')}</span></div>
                            <div class="grid-item"><strong>Serial #(s):</strong> <span>${serials}</span></div>
                            <div class="grid-item"><strong>SSDR:</strong> <span>${getItemValue('ssdr')}</span></div>
                            <div class="grid-item"><strong>Radionuclide:</strong> <span>${itemData.radionuclide}</span></div>
                            <div class="grid-item"><strong>Activity:</strong> <span>${itemData.activity_ci_str}</span></div>
                            <div class="grid-item"><strong>Assay Date:</strong> <span>${formatDate(getItemValue('assayDate'))}</span></div>
                            <div class="grid-item"><strong>Licensed:</strong> <span>${getItemValue('licensed')}</span></div>
                            <div class="grid-item"><strong>License/Permit #:</strong> <span>${getItemValue('licenseNumber')}</span></div>
                            <div class="grid-item"><strong>Form:</strong> <span>${getItemValue('form')}</span></div>
                            <div class="grid-item"><strong>Volume:</strong> <span>${getItemValue('volume')}</span></div>
                            <div class="grid-item"><strong>Weight:</strong> <span>${getItemValue('weight')}</span></div>
                            <div class="grid-item"><strong>Other Info:</strong> <span>${getItemValue('otherInfo')}</span></div>
                            <div class="grid-item"><strong>Mfg. Name:</strong> <span>${getItemValue('mfgName')}</span></div>
                            <div class="grid-item"><strong>Mfg. Model:</strong> <span>${getItemValue('mfgModel')}</span></div>
                            <div class="grid-item"><strong>Mfg. Date:</strong> <span>${formatDate(getItemValue('mfgDate'))}</span></div>
                        </div></div>`;
      });
      printContent += `</div>`;
      const images = await Promise.all(imagePromises);
      if (images.length > 0) {
         printContent += `<div class="section" style="page-break-before: always;"><h2>Attached Images</h2>`;
         images.forEach(image => {
            printContent += `<div class="item-card"><h3>${image.name}</h3><img src="${image.url}" class="item-image"></div>`;
         });
         printContent += `</div>`;
      }
      printContent += `
                    <div class="section"><h2>Pickup Location</h2><div class="grid-print">
                        <div class="grid-item"><strong>Address:</strong> <span>${getValue('pickupAddress')}</span></div>
                        <div class="grid-item"><strong>Building #:</strong> <span>${getValue('pickupBuilding')}</span></div>
                    </div></div><div class="section">${analysisContentHTML}</div></body></html>`;
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
         printWindow.print();
      }, 500);
   });

   function populateRadionuclideFilter() {
      const nuclides = [...new Set(tableData.map(item => item.radionuclide))].sort();
      radionuclideFilter.innerHTML = '<option value="all">All Radionuclides</option>';
      nuclides.forEach(nuclide => {
         const option = document.createElement('option');
         option.value = nuclide;
         option.textContent = nuclide;
         radionuclideFilter.appendChild(option);
      });
   }

   saveSelectionBtn.addEventListener('click', () => {
      // Save the Global Set, not just querySelectorAll
      const idsToSave = Array.from(selectedIds);
      safeSetItem('savedSelection', JSON.stringify(idsToSave));
      showToast('Selection saved!', 'success');
      loadSelectionBtn.disabled = false;
      clearSavedBtn.disabled = false;
   });

   loadSelectionBtn.addEventListener('click', () => {
      const savedSelection = safeGetItem('savedSelection');
      const savedIds = JSON.parse(savedSelection || '[]');
      if (!savedIds || savedIds.length === 0) return;
      clearSelectionBtn.click();
      savedIds.forEach(id => {
         const checkbox = document.querySelector(`.row-checkbox[data-id="${id}"]`);
         if (checkbox) {
            checkbox.checked = true;
            const changeEvent = new Event('change', {
               bubbles: true
            });
            checkbox.dispatchEvent(changeEvent);
         }
      });
      showToast('Selection loaded.', 'info');
   });
   clearSavedBtn.addEventListener('click', () => {
      showConfirmationModal('Are you sure you want to clear your saved selection?', () => {
         safeRemoveItem('savedSelection');
         clearSavedBtn.disabled = true;
         loadSelectionBtn.disabled = true;
         showToast('Saved selection cleared.', 'success');
      });
   });
   selectAllCheckbox.addEventListener('change', () => {
      const isChecked = selectAllCheckbox.checked;
      const visibleCheckboxes = document.querySelectorAll('#lookupTable tbody tr .row-checkbox');
      visibleCheckboxes.forEach(checkbox => {
         if (checkbox.checked !== isChecked) {
            checkbox.checked = isChecked;
            const changeEvent = new Event('change', {
               bubbles: true
            });
            checkbox.dispatchEvent(changeEvent);
         }
      });
   });
   addItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newItemData = {
         name: document.getElementById('itemName').value,
         nsn: document.getElementById('itemNsn').value,
         radionuclide: document.getElementById('itemRadionuclide').value,
         activity: document.getElementById('itemActivity').value,
         units: document.getElementById('itemUnits').value,
      };
      const customItemsJSON = safeGetItem('customItems');
      let customItems = JSON.parse(customItemsJSON || '[]');
      const editId = document.getElementById('itemEditId').value;
      if (editId) {
         const index = customItems.findIndex(item => item.id == editId);
         if (index > -1) {
            customItems[index] = {
               ...newItemData,
               id: parseInt(editId)
            };
         }
         showToast('Item updated!', 'success');
      } else {
         const newId = Date.now();
         customItems.push({
            ...newItemData,
            id: newId
         });
         showToast('Item added!', 'success');
      }
      safeSetItem('customItems', JSON.stringify(customItems));
      tableData = processData(rawTableData, customItems);
      filterTable();
      populateRadionuclideFilter();
      updateCustomItemButtonsState();
      closeModal(addItemModal);
   });
   clearAddedBtn.addEventListener('click', () => {
      showConfirmationModal("Are you sure you want to delete all custom-added items? This action cannot be undone.", () => {
         safeRemoveItem('customItems');
         tableData = processData(rawTableData, []);
         filterTable();
         populateRadionuclideFilter();
         updateCustomItemButtonsState();
         showToast('All custom items have been deleted.', 'success');
      });
   });

   function populateAddItemRadionuclides() {
      const nuclides = [...new Set(Object.keys(nrcExemptionValues))].sort();
      itemRadionuclideSelect.innerHTML = '';
      nuclides.forEach(nuclide => {
         const option = document.createElement('option');
         option.value = nuclide;
         option.textContent = nuclide;
         itemRadionuclideSelect.appendChild(option);
      });
   }

   function showAddItemModal(itemToEdit = null) {
      addItemForm.reset();
      if (itemToEdit) {
         const customItemsJSON = safeGetItem('customItems');
         const customItems = JSON.parse(customItemsJSON || '[]');
         const originalCustomItem = customItems.find(ci => ci.id === itemToEdit.id);
         document.getElementById('addItemModalTitle').textContent = 'Edit Custom Item';
         document.getElementById('saveItemBtn').textContent = 'Update Item';
         document.getElementById('itemEditId').value = itemToEdit.id;
         document.getElementById('itemName').value = itemToEdit.name;
         document.getElementById('itemNsn').value = itemToEdit.nsn;
         document.getElementById('itemRadionuclide').value = itemToEdit.radionuclide;
         if (originalCustomItem) {
            document.getElementById('itemActivity').value = originalCustomItem.activity;
            document.getElementById('itemUnits').value = originalCustomItem.units;
         }
      } else {
         document.getElementById('addItemModalTitle').textContent = 'Add Custom Item';
         document.getElementById('saveItemBtn').textContent = 'Save Item';
         document.getElementById('itemEditId').value = '';
      }
      openModal(addItemModal);
   }

   function deleteCustomItem(itemId) {
      const customItemsJSON = safeGetItem('customItems');
      let customItems = JSON.parse(customItemsJSON || '[]');
      customItems = customItems.filter(item => item.id !== itemId);
      safeSetItem('customItems', JSON.stringify(customItems));
      tableData = processData(rawTableData, customItems);
      filterTable();
      populateRadionuclideFilter();
      updateCustomItemButtonsState();
      showToast('Item deleted.', 'success');
   }

   function updateCustomItemButtonsState() {
      const customItemsJSON = safeGetItem('customItems');
      const customItems = JSON.parse(customItemsJSON || '[]');
      const hasCustomItems = customItems.length > 0;
      clearAddedBtn.disabled = !hasCustomItems;
      exportCustomBtn.disabled = !hasCustomItems;
   }
   exportCustomBtn.addEventListener('click', () => {
      const customItemsJSON = safeGetItem('customItems');
      const customItems = JSON.parse(customItemsJSON || '[]');
      if (customItems.length === 0) {
         showToast('No custom items to export.', 'error');
         return;
      }
      const jsonString = JSON.stringify(customItems, null, 2);
      const blob = new Blob([jsonString], {
         type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'radioactive_commodities_custom.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Custom items exported!', 'success');
   });
   importCustomBtn.addEventListener('click', () => {
      importFileInput.click();
   });
   importFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
         try {
            const importedItems = JSON.parse(e.target.result);
            if (!Array.isArray(importedItems)) {
               throw new Error('Imported file is not a valid list.');
            }
            showConfirmationModal('Do you want to REPLACE your current custom items with the imported list?', () => {
               safeSetItem('customItems', JSON.stringify(importedItems));
               tableData = processData(rawTableData, importedItems);
               filterTable();
               populateRadionuclideFilter();
               updateCustomItemButtonsState();
               showToast('Custom items imported successfully!', 'success');
            });
         } catch (error) {
            showToast('Error reading or parsing the file.', 'error');
            console.error("Import error:", error);
         } finally {
            event.target.value = null;
         }
      };
      reader.readAsText(file);
   });

   function saveState() {
      const state = {
         searchTerm: searchInput.value,
         radionuclide: radionuclideFilter.value,
         nrcExempt: nrcExemptFilter.checked,
         dotExempt: dotExemptFilter.checked,
         isSiUnits: unitToggle.checked,
         sortColumn: currentSort.column,
         sortDirection: currentSort.direction
      };
      safeSetItem('lookupTableState', JSON.stringify(state));
   }

   function loadState() {
      const savedState = safeGetItem('lookupTableState');
      if (savedState) {
         const state = JSON.parse(savedState);
         searchInput.value = state.searchTerm || '';
         radionuclideFilter.value = state.radionuclide || 'all';
         nrcExemptFilter.checked = state.nrcExempt || false;
         dotExemptFilter.checked = state.dotExempt || false;
         unitToggle.checked = state.isSiUnits || false;
         currentSort.column = state.sortColumn || null;
         currentSort.direction = state.sortDirection || 'asc';
      }
   }

   function showConfirmationModal(message, onConfirm) {
      confirmModalText.textContent = message;
      confirmCallback = onConfirm;
      openModal(confirmModal);
   }
   clearFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      radionuclideFilter.value = 'all';
      nrcExemptFilter.checked = false;
      dotExemptFilter.checked = false;
      currentSort.column = 'name';
      currentSort.direction = 'asc';
      safeRemoveItem('lookupTableState');
      performSort();
   });

   function showRadionuclideModal(nuclideId) {
      const details = radionuclideDetails[nuclideId];
      if (!details) return;
      const modalTitle = document.getElementById('radionuclideModalTitle');
      const modalContent = document.getElementById('radionuclideContent');
      modalTitle.textContent = `${details.name} (${nuclideId})`;
      let content = `<div class="space-y-3">`;
      content += `<div class="flex justify-between"><strong>Half-life:</strong> <span>${details.halfLife}</span></div>`;
      content += `<div class="flex justify-between"><strong>Decay Mode:</strong> <span>${details.decayMode}</span></div>`;
      content += `<div class="mt-4"><a href="${details.wiki}" target="_blank" class="text-blue-500 hover:underline">Learn More on Wikipedia</a></div>`;
      content += `</div>`;
      modalContent.innerHTML = content;
      openModal(radionuclideDetailModal);
   }

   function showTooltipModal(tooltipKey) {
      const tooltipModalTitle = document.getElementById('tooltipModalTitle');
      const tooltipContent = document.getElementById('tooltipContent');
      const tooltipData = {
         'nrc_exemption_val': {
            title: 'NRC Exemption Limit',
            content: `<p class="mb-2">This value comes from <strong>10 CFR § 30.71, Schedule B</strong>.</p><p class="mb-2">It represents the maximum activity of a specific radionuclide that can be contained in a single "exempt quantity" item.</p><p>If an item's activity is at or below this limit, it is generally exempt from NRC licensing requirements for possession and use, provided it's not part of a larger aggregated quantity.</p><a href="https://www.nrc.gov/reading-rm/doc-collections/cfr/part030/part030-0071.html" target="_blank" class="text-blue-500 hover:underline">View Regulation</a>`
         },
         'dot_exemption_val': {
            title: 'DOT Exemption Limit (Consignment)',
            content: `<p class="mb-2">This value comes from the "Activity limit for an exempt consignment" column in the table at <strong>49 CFR § 173.436</strong>.</p><p class="mb-2">It represents the maximum total activity of a specific radionuclide that can be in a single shipment (consignment) to be considered exempt from most hazmat shipping regulations.</p><p>This is a consignment-level limit, not a per-item or per-package limit.</p><a href="https://www.ecfr.gov/current/title-49/subtitle-B/chapter-I/subchapter-C/part-173/subpart-I/section-173.436" target="_blank" class="text-blue-500 hover:underline">View Regulation</a>`
         },
         'un2911_limit_val': {
            title: 'UN 2911 Limit (Per Item)',
            content: `<p class="mb-2">This value comes from the "Item limits" column in the table at <strong>49 CFR § 173.425</strong> for "Instruments and articles".</p><p class="mb-2">It is the maximum activity of a specific radionuclide allowed in a single instrument or article to be shipped as an "Excepted package" under UN 2911.</p><p>Items meeting this limit can be shipped with reduced regulatory requirements compared to fully regulated radioactive material.</p><a href="https://www.ecfr.gov/current/title-49/subtitle-B/chapter-I/subchapter-C/part-173/subpart-I/section-173.425" target="_blank" class="text-blue-500 hover:underline">View Regulation</a>`
         },
         'un2911_pkg_limit_val': {
            title: 'UN 2911 Limit (Per Package)',
            content: `<p class="mb-2">This value comes from the "Package limits" column in the table at <strong>49 CFR § 173.425</strong> for "Instruments and articles".</p><p class="mb-2">It is the maximum total activity of a specific radionuclide allowed in a single package containing one or more excepted items to be shipped under UN 2911.</p><p>Even if individual items are below the item limit, the total activity in the package must not exceed this limit.</p><a href="https://www.ecfr.gov/current/title-49/subtitle-B/chapter-I/subchapter-C/part-173/subpart-I/section-173.425" target="_blank" class="text-blue-500 hover:underline">View Regulation</a>`
         }
      };
      const data = tooltipData[tooltipKey];
      if (!data) return;
      tooltipModalTitle.innerHTML = data.title;
      tooltipContent.innerHTML = data.content;
      openModal(tooltipModal);
   }
   generateMemoBtn.addEventListener('click', () => {
      const form = document.getElementById('disposalRequestForm');
      let primaryPocName = '[POC Name]';
      let primaryPocEmail = '[POC Email]';
      const pocCards = form.querySelectorAll('.poc-card');
      for (let i = 0; i < pocCards.length; i++) {
         const card = pocCards[i];
         const pocNumber = i + 1;
         const nameInput = card.querySelector(`[data-form-id="poc${pocNumber}Name"]`);
         const emailInput = card.querySelector(`[data-form-id="poc${pocNumber}Email"]`);
         if (nameInput && nameInput.value.trim() !== '') {
            primaryPocName = nameInput.value;
            primaryPocEmail = emailInput ? emailInput.value : '[POC Email]';
            break;
         }
      }
      const fundingChoice = form.querySelector('[data-form-id="funding"]').value;
      const commandName = form.querySelector('[data-form-id="commandName"]').value || '[Command Name]';
      const commandAddress = form.querySelector('[data-form-id="streetAddress"]').value || '[Command Address]';
      const date = new Date().toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
      const memoText = `
                                                                                                                                   5104
                                                                                                                                   Ser ##/###
                                                                                                                                   ${date}


From:   Title, ${commandName}, ${commandAddress}
To:     Officer in Charge, Naval Sea Systems Command Detachment, Radiological Affairs Support Office (RASO)

Subj:   REQUEST FOR LOW-LEVEL RADIOACTIVE WASTE DISPOSAL

Encl:   (1) Low-Level Radioactive Waste Disposal Request – Command Information
        (2) Low-Level Radioactive Waste Disposal Request – Command Inventory

The purpose of this letter is to request disposal of low-level radioactive waste (LLRW). Enclosure (1) provides information about the command and my LLRW point of contact. Enclosure (2) provides the command’s LLRW inventory. The command ${fundingChoice} intend to provide funds for this disposal.

Enclosures (1) and (2) are provided in electronic format.

The point of contact is ${primaryPocName} who can be reached at ${primaryPocEmail}.



    I. M. SIGNATURE

Copy to:
As needed`;
      memoContent.textContent = memoText;
      openModal(memoModal);
   });

   // Add all modal closing event listeners
   closeModalBtn.addEventListener('click', () => closeModal(compareModal));
   closeDetailModalBtn.addEventListener('click', () => closeModal(detailModal));
   closeDisposalRequestModalBtn.addEventListener('click', () => closeModal(disposalRequestModal));
   closeHelpModalBtn.addEventListener('click', () => closeModal(helpModal));
   closeAddItemModalBtn.addEventListener('click', () => closeModal(addItemModal));
   cancelAddItemBtn.addEventListener('click', () => closeModal(addItemModal));
   confirmModalCancelBtn.addEventListener('click', () => {
      closeModal(confirmModal);
      confirmCallback = null;
   });
   closeRadionuclideModalBtn.addEventListener('click', () => closeModal(radionuclideDetailModal));
   closeTooltipModalBtn.addEventListener('click', () => closeModal(tooltipModal));
   closeMemoModalBtn.addEventListener('click', () => closeModal(memoModal));
   closeInstructionsModalBtn.addEventListener('click', () => closeModal(instructionsModal));
   confirmModalConfirmBtn.addEventListener('click', () => {
      if (typeof confirmCallback === 'function') {
         confirmCallback();
      }
      closeModal(confirmModal);
      confirmCallback = null;
   });
   document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
         const openModal = allModals.find(m => m.style.display !== 'none');
         if (openModal) {
            closeModal(openModal);
         }
      }
   });
   allModals.forEach(modal => {
      modal.addEventListener('click', (event) => {
         if (event.target === modal) {
            closeModal(modal);
         }
      });
   });

   document.querySelectorAll('th.sortable').forEach(header => {
      header.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            header.click();
         }
      });
   });

   // Other button/form event listeners
   disposalRequestBtn.addEventListener('click', showDisposalRequestModal);
   helpBtn.addEventListener('click', () => openModal(helpModal));
   showInstructionsBtn.addEventListener('click', () => openModal(instructionsModal));
   addItemBtn.addEventListener('click', () => showAddItemModal());
   copyMemoBtn.addEventListener('click', () => copyToClipboard(memoContent.textContent, null));
   const debouncedFilterAndSave = debounce(() => {
      filterTable();
      saveState();
   }, 300);
   searchInput.addEventListener('input', () => {
      clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
      debouncedFilterAndSave();
   });
   clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      filterTable();
      saveState();
   });
   exportCsvBtn.addEventListener('click', exportDisposalRequestAsCSV);
   radionuclideFilter.addEventListener('change', debouncedFilterAndSave);
   nrcExemptFilter.addEventListener('change', debouncedFilterAndSave);
   dotExemptFilter.addEventListener('change', debouncedFilterAndSave);
   unitToggle.addEventListener('change', () => {
      filterTable();
      saveState();
   });

   const nsnInput = document.getElementById('itemNsn');
   if (nsnInput) {
      nsnInput.addEventListener('input', (e) => {
         e.target.value = formatNSN(e.target.value);
      });
   }

   // Initial page load setup
   const customItemsJSON = safeGetItem('customItems');
   const customItems = JSON.parse(customItemsJSON || '[]');
   tableData = processData(rawTableData, customItems);
   populateRadionuclideFilter();
   populateAddItemRadionuclides();
   updateCustomItemButtonsState();
   loadState();
   clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
   currentSort.column = currentSort.column || 'name';
   currentSort.direction = 'asc';
   performSort(); // This automatically wipes the loading row, so we don't need to hide it manually.

   if (safeGetItem('savedSelection')) {
      loadSelectionBtn.disabled = false;
      clearSavedBtn.disabled = false;
   }
});
