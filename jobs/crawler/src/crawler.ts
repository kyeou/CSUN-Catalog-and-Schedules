import process from "process";
import argparse from "argparse";
import { setTimeout } from "timers/promises";
import puppeteer, { Page, TimeoutError } from "puppeteer";

import { CatalogNumberSchedule, SubjectSchedule } from "./interfaces";
import { convertTime, convertDays } from "./utilities";
import { ProgressBar } from "./progress";
import { sortToControl } from "./order";
import { updateDB } from "./database";

const parser = new argparse.ArgumentParser({
	prog: "Scheduled Crawler"
});

parser.add_argument("--semester_key", {
	type: "str"
});

parser.add_argument("-i", {
	action: "store_true"
});

const args = parser.parse_args();

const catalog_link =
	"https://cmsweb.csun.edu/psc/CNRPRD/EMPLOYEE/SA/c/NR_SSS_COMMON_MENU.NR_SSS_SOC_BASIC_C.GBL?PortalActualURL=https%3a%2f%2fcmsweb.csun.edu%2fpsc%2fCNRPRD%2fEMPLOYEE%2fSA%2fc%2fNR_SSS_COMMON_MENU.NR_SSS_SOC_BASIC_C.GBL&PortalContentURL=https%3a%2f%2fcmsweb.csun.edu%2fpsc%2fCNRPRD%2fEMPLOYEE%2fSA%2fc%2fNR_SSS_COMMON_MENU.NR_SSS_SOC_BASIC_C.GBL&PortalContentProvider=SA&PortalCRefLabel=Class%20Search&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fmynorthridge.csun.edu%2fpsp%2fPANRPRD%2f&PortalURI=https%3a%2f%2fmynorthridge.csun.edu%2fpsc%2fPANRPRD%2f&PortalHostNode=EMPL&NoCrumbs=yes&PortalKeyStruct=yes";
let course_offer_count: { [subject: string]: number } = {};

const semester_key: string = args.semester_key;
let _TERM: { semester: string; year: number };
let started: number = 0;

async function collect_subjects(): Promise<string[]> {
	{
		/*Get subjects that have course offerings*/
	}
	let class_codes: string[] = [];
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();
	await page.goto(catalog_link);

	await page.waitForFunction(
		() => {
			const pageText = document.body.textContent;
			return pageText!.includes("California State University, Northridge");
		},
		{ timeout: 60000 }
	);

	await select_semester(page, semester_key);

	await page.waitForSelector(`select[id="NR_SSS_SOC_NWRK_SUBJECT"]`, {
		timeout: 4000
	});
	const dropdown = await page.$("#NR_SSS_SOC_NWRK_SUBJECT");
	const options = await dropdown!.$$("option");

	for (const option of options) {
		const valueAttribute = await option.getProperty("value")!;
		const value = await valueAttribute.jsonValue();
		// && value !== "S ED" && value !== "QS"&& value !== "MKT"
		if (typeof value === "string" && value !== "") {
			class_codes.unshift(value);
		}
	}
	// console.log(class_codes);
	browser.close();
	return sortToControl(class_codes).reverse();
}

async function select_semester(_PAGE: Page, semester_key: string): Promise<void> {
	const dropdown = await _PAGE.$("#NR_SSS_SOC_NWRK_STRM");
	const selected = await dropdown!.$('option[selected="selected"]');
	await _PAGE.evaluate((option: HTMLOptionElement) => {
		option.removeAttribute("selected");
	}, selected!);

	const optionToSelect = await dropdown!.$(`option[value="${semester_key}"]`);
	await _PAGE.evaluate((option: HTMLOptionElement) => {
		option.setAttribute("selected", "selected");
	}, optionToSelect!);

	await setTimeout(100);

	const term_selected: boolean = await _PAGE.$eval(`option[value="${semester_key}"]`, (option) => {
		/* 2243 - Spring Semester 2024*/
		return option.hasAttribute("selected");
	});
	const term_innertext: string = await _PAGE.$eval(
		`option[value="${semester_key}"]`,
		(element) => element.textContent!
	);
	let term: string[] = term_innertext.split(" ");
	_TERM = { semester: term[2], year: Number(term[4]) };
	// console.log(_TERM);
	if (!term_selected) {
		console.error("Incorrect semester selected");
		process.exit(-1);
	}
	// await setTimeout(3000);
}

async function select_subject(page: Page, subject: string): Promise<void> {
	const dropdown = await page.$("#NR_SSS_SOC_NWRK_SUBJECT");

	let selected = await dropdown!.$('option[selected="selected"]');
	let value = await page.evaluate((option: HTMLOptionElement) => {
		return option.getAttribute("value");
	}, selected!);

	let optionToSelect = await dropdown!.$(`option[value="${subject}"]`);

	await page.evaluate((option: HTMLOptionElement) => {
		option.setAttribute("selected", "selected");
	}, optionToSelect!);

	let subject_selected: boolean = await page.evaluate((option: HTMLOptionElement) => {
		return option.hasAttribute("selected");
	}, optionToSelect!);

	while (!subject_selected) {
		console.error(`${subject} was not selected, instead ${value} was`);
		await page.evaluate((option: HTMLOptionElement) => {
			option.removeAttribute("selected");
		}, selected!);

		optionToSelect = await dropdown!.$(`option[value="${subject}"]`);
		await page.evaluate((option: HTMLOptionElement) => {
			option.setAttribute("selected", "selected");
		}, optionToSelect!);

		subject_selected = await page.evaluate((option: HTMLOptionElement) => {
			return option.hasAttribute("selected");
		}, optionToSelect!);
	}
}

async function unselect_section_expansion(_PAGE: Page): Promise<void> {
	await setTimeout(100);
	let box_unselected: boolean = await _PAGE.$eval(`input[id="EXPANDCNT$chk"]`, (option) => {
		return option.getAttribute("value") === "N";
	});

	while (!box_unselected) {
		await _PAGE.click("#EXPANDCNT");

		box_unselected = await _PAGE.$eval(`input[id="EXPANDCNT$chk"]`, (option) => {
			return option.getAttribute("value") === "N";
		});
	}
}

async function start_search(_PAGE: Page): Promise<number | boolean> {
	await _PAGE.click("#NR_SSS_SOC_NWRK_BASIC_SEARCH_PB");

	await _PAGE.waitForFunction(
		() => {
			const pageText = document.body.textContent;
			return pageText!.includes("Course List");
		},
		{ timeout: 10000 }
	);

	try {
		await _PAGE.waitForSelector('span[class="PSGRIDCOUNTER"]', { timeout: 20000 });
	} catch (err) {
		if (err instanceof TimeoutError) {
			// const dropdown = await _PAGE.$("#NR_SSS_SOC_NWRK_SUBJECT");

			// let selected = await dropdown!.$('option[selected="selected"]');
			// let value = await _PAGE.evaluate((option: HTMLOptionElement) => {
			// 	return option.getAttribute("value");
			// }, selected!);

			// console.log(`${value} failed to search`);
			return false;
		}
	}

	const counter: string = await _PAGE.$eval(
		'span[class="PSGRIDCOUNTER"]',
		(element) => element.textContent!
	);
	const count: number = Number(counter.split(" ").pop());

	await setTimeout(2000);
	return count as number;
}

async function collect_sch_for_class(
	_PAGE: Page,
	_SUBJECT: string,
	SOC_INDEX: number
): Promise<CatalogNumberSchedule> {
	// console.log("for class");
	const class_schedule: CatalogNumberSchedule = {};
	const class_title: string = await _PAGE.$eval(
		`span[id="NR_SSS_SOC_NWRK_DESCR100_2$${SOC_INDEX}"]`,
		(element) => element.textContent!
	);
	const curr_catalog_number: string =
		class_title.split(" ")[3] === "-" ? class_title.split(" ")[2] : class_title.split(" ")[1];
	class_schedule[curr_catalog_number] = {};

	let offering: number = 0;

	await _PAGE.click(`img[id="SOC_DETAIL$IMG$${SOC_INDEX}"]`);
	await _PAGE.waitForSelector(`img[id="SOC_DETAIL1$IMG$${SOC_INDEX}"]`, { timeout: 2000 });

	while (true) {
		try {
			await setTimeout(200);
			await _PAGE.waitForSelector(`img[id="CLASS_DETAILS\$IMG\$${offering}"]`, {
				timeout: 5000
			});
			await _PAGE.click(`img[id="CLASS_DETAILS\$IMG\$${offering}"]`);
			await _PAGE.waitForFunction(
				() => {
					const pageText = document.body.textContent;
					return pageText!.includes("Class Detail");
				},
				{ timeout: 10000 }
			);

			const class_number: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NSEC_CLASS_NBR"]`,
				(element) => element.textContent!
			);

			const enrollment_cap: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NSEC_ENRL_CAP"]`,
				(element) => element.textContent!
			);

			const enrollment_count: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NSEC_ENRL_TOT"]`,
				(element) => element.textContent!
			);

			const waitlist_cap: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NSEC_WAIT_CAP"]`,
				(element) => element.textContent!
			);

			const waitlist_count: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NSEC_WAIT_TOT"]`,
				(element) => element.textContent!
			);

			const location: string = await _PAGE.$eval(
				`a[id="MAP_DETPG$0"]`,
				(element) => element.textContent!
			);

			const days: string = await _PAGE.$eval(
				`span[id="NR_SSS_SOC_NWRK_DESCR$0"]`,
				(element) => element.textContent!
			);

			const time: string = await _PAGE.$eval(
				`span[id="TIME$span$0"]`,
				(element) => element.textContent!
			);

			let instructor: string = await _PAGE.$eval(
				`span[id="INSTRUCTOR_URL$span$0"]`,
				(element) => element.textContent!
			);

			if (instructor === undefined) {
				instructor = await _PAGE.$eval(
					`a[id="INSTRUCTOR_URL$0"]`,
					(element) => element.textContent!
				);
			}

			await _PAGE.click('input[id="NR_SSS_SOC_NWRK_RETURN_PB"]');

			class_schedule[curr_catalog_number][class_number] = {
				...{
					class_number: class_number,
					enrollment_cap: Number(enrollment_cap),
					enrollment_count: Number(enrollment_count),
					waitlist_cap: Number(waitlist_cap),
					waitlist_count: Number(waitlist_count),
					location: location,
					days: convertDays(days),
					instructor: instructor
				},
				...convertTime(time)
			};

			await updateDB(
				{
					...class_schedule[curr_catalog_number][class_number],
					...{ catalog_number: curr_catalog_number }
				},
				_TERM,
				_SUBJECT
			);

			offering++;
		} catch (err) {
			// console.log(err)
			if (err instanceof Error) {
				break;
			}
		}
	}
	// await page.screenshot({ path: 'exp.png', fullPage: true });
	await _PAGE.waitForSelector(`img[id="SOC_DETAIL1$IMG$${SOC_INDEX}"]`, {
		timeout: 4000
	});
	await _PAGE.click(`img[id="SOC_DETAIL1$IMG$${SOC_INDEX}"]`);
	await _PAGE.waitForSelector(`img[id="SOC_DETAIL$IMG$${SOC_INDEX}"]`, {
		timeout: 4000
	});
	// await page.screenshot({ path: 'coll.png', fullPage: true });
	return class_schedule;
}

async function collect_sch_for_subject_portal(
	_PAGE: Page,
	_SUBJECT: string,
	_TOTAL_CLASSES: number
): Promise<void> {
	let subject_schedule: SubjectSchedule = {};
	let SOC_INDEX: number = 0;
	// Example usage

	const bar: ProgressBar = new ProgressBar(_TOTAL_CLASSES, started++, _SUBJECT);

	while (true) {
		try {
			await _PAGE.waitForSelector(`img[id="SOC_DETAIL$IMG$${SOC_INDEX}"]`, {
				timeout: 500
			});
			const sch_for_catalog_num: CatalogNumberSchedule = await collect_sch_for_class(
				_PAGE,
				_SUBJECT,
				SOC_INDEX
			);
			subject_schedule[_SUBJECT] = {
				...subject_schedule[_SUBJECT],
				...sch_for_catalog_num
			};

			await bar.update(SOC_INDEX++);
		} catch (err) {
			await bar.update(SOC_INDEX++);
			break; // nothing left
		}
	}
	/*
	if (_SUBJECT === "COMP") {
		fs.writeFileSync(
			`./${getLettersOnly(_SUBJECT)}_schedule.json`,
			JSON.stringify(subject_schedule)
		);
		console.log(subject_schedule);
	}*/
}

async function for_subject(_SUBJECT: string): Promise<String> {
	return new Promise<String>(async (resolve) => {
		const browser = await puppeteer.launch({ headless: "new", args: ["--use-gl=egl"] });
		const page = await browser.newPage();

		await page.goto(catalog_link, { timeout: 120000 });

		await page.waitForFunction(
			() => {
				const pageText = document.body.textContent;
				return pageText!.includes("California State University, Northridge");
			},
			{ timeout: 60000 }
		);

		await select_semester(page, semester_key);
		await select_subject(page, _SUBJECT);
		await unselect_section_expansion(page);
		const search_result: number | boolean = await start_search(page);
		if (search_result) {
			course_offer_count[_SUBJECT] = search_result as number;
			await collect_sch_for_subject_portal(page, _SUBJECT, search_result as number);
			await browser.close();
			resolve(`${_SUBJECT} done`);
		} else {
			await browser.close();
			resolve(`${_SUBJECT} has no offerings`);
		}
	});
}

export { collect_subjects, for_subject };