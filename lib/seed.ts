/** Built-in defaults. The app writes these to the database on first use if the tables are empty, so forms never show an empty list. */
export const SEED_AREAS: [string, string, number, number][] = [
  ["satellite", "Satellite", 23.03, 72.51], ["bodakdev", "Bodakdev", 23.0396, 72.5112], ["prahlad-nagar", "Prahlad Nagar", 23.012, 72.5108], ["vastrapur", "Vastrapur", 23.0375, 72.529],
  ["thaltej", "Thaltej", 23.0536, 72.5082], ["sg-highway", "SG Highway", 23.0731, 72.516], ["bopal", "Bopal", 23.034, 72.464], ["navrangpura", "Navrangpura", 23.0366, 72.5614],
  ["paldi", "Paldi", 23.0102, 72.5601], ["ambawadi", "Ambawadi", 23.021, 72.5557], ["naranpura", "Naranpura", 23.056, 72.553], ["memnagar", "Memnagar", 23.048, 72.54],
  ["ghatlodia", "Ghatlodia", 23.072, 72.546], ["gota", "Gota", 23.0988, 72.5446], ["chandkheda", "Chandkheda", 23.1, 72.585], ["maninagar", "Maninagar", 22.9958, 72.6024],
  ["cg-road", "CG Road", 23.0305, 72.5593], ["manek-chowk", "Manek Chowk", 23.0242, 72.5871], ["law-garden", "Law Garden", 23.0258, 72.5575], ["hl-college-road", "HL College Road", 23.0345, 72.5465],
  ["ellisbridge", "Ellisbridge", 23.0245, 72.5655], ["sabarmati", "Sabarmati", 23.0815, 72.5842], ["isanpur", "Isanpur", 22.9686, 72.6025], ["vastral", "Vastral", 23.0, 72.65],
];
export const SEED_CITIES: [string, string, string, boolean][] = [
  ["ahmedabad", "Ahmedabad", "Gujarat", true], ["gandhinagar", "Gandhinagar", "Gujarat", false], ["surat", "Surat", "Gujarat", false], ["vadodara", "Vadodara", "Gujarat", false], ["rajkot", "Rajkot", "Gujarat", false],
  ["mumbai", "Mumbai", "Maharashtra", false], ["pune", "Pune", "Maharashtra", false], ["delhi", "Delhi", "Delhi", false], ["noida", "Noida", "Uttar Pradesh", false], ["gurugram", "Gurugram", "Haryana", false],
  ["bengaluru", "Bengaluru", "Karnataka", false], ["hyderabad", "Hyderabad", "Telangana", false], ["chennai", "Chennai", "Tamil Nadu", false], ["kolkata", "Kolkata", "West Bengal", false],
  ["jaipur", "Jaipur", "Rajasthan", false], ["udaipur", "Udaipur", "Rajasthan", false], ["indore", "Indore", "Madhya Pradesh", false], ["bhopal", "Bhopal", "Madhya Pradesh", false],
  ["lucknow", "Lucknow", "Uttar Pradesh", false], ["chandigarh", "Chandigarh", "Chandigarh", false], ["kochi", "Kochi", "Kerala", false], ["nagpur", "Nagpur", "Maharashtra", false],
];
