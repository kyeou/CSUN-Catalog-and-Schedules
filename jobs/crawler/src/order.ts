// This is a auto-generated ordered list of the subject that have the most classes
// for Spring 2023.
// Can be used as a rough estimate of which semesters take the longest
// Ordered from most to least
const control_order: string[] = [
	"MUS", "ART", "KIN", "BIOL", "FCS", "CTVA", "HSCI", "ENGL", "MATH", "ECE", "GEOG", "SPED", "COMS", "EPC", "POLS", "TH", "CHEM",
	"PSY", "SOC", "HIST", "COMP", "CH S", "RTM", "CD", "M E", "CJS", "PHYS", "E ED", "AFRS", "JOUR", "MSE", "ANTH", "GEOL", "C E",
	"PT", "DEAF", "CADV", "S ED", "ACCT", "FIN", "AAS", "EOH", "PHIL", "LING", "ELPS", "R S", "UNIV", "URBS", "ATHL", "MKT", "ECON",
	"CIT", "SPAN", "SWRK", "CM", "MGT", "CAS", "BLAW", "QS", "GWS", "IS", "SOM", "BUS", "AT", "ASTR", "LR S", "FLIT", "MCOM", "AIS",
	"J S", "RE", "A M", "ENT", "NURS", "ARMN", "BANA", "GBUS", "INDS", "ITAL", "JAPN", "SUST", "A E", "CHIN", "CLAS", "FREN", "HUM",
	"KOR", "PERS", "RUSS", "SCM", "SUS", "A/R", "ARAB", "CCE", "CECS", "EDUC", "GEH", "HEBR", "HHD", "HUMN", "LIB", "PHSC", "SCI"
];

export function sort_to_control(unsorted_array: string[]): string[] {
	unsorted_array.sort((a, b) => {
		const a_index = control_order.indexOf(a);
		const b_index = control_order.indexOf(b);
		return a_index - b_index;
	});

	return unsorted_array;
}

