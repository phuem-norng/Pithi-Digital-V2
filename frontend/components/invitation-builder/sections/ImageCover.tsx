'use client';

import { useSearchParams } from 'next/navigation';
import type { BuilderState } from '../types';

type ImageCoverProps = {
	data: BuilderState;
};

function toKhmerDigits(value: string | number) {
	const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
	return String(value).replace(/\d/g, (digit) => khmerDigits[Number(digit)]);
}

function parseDateTimeParts(rawDate: string) {
	const normalized = rawDate
		.replace(/[\u00A0\u202F]/g, ' ')
		.trim();

	// Matches: DD/MM/YYYY, hh:mm AM/PM (or without comma)
	const dmyAmPm = normalized.match(
		/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
	);

	if (dmyAmPm) {
		let day = Number(dmyAmPm[1]);
		let month = Number(dmyAmPm[2]);
		const year = Number(dmyAmPm[3]);
		const minute = Number(dmyAmPm[5] || '0');
		const amPm = (dmyAmPm[6] || '').toUpperCase();

		// Support accidental MM/DD/YYYY input by swapping when month is impossible.
		if (month > 12 && day <= 12) {
			const swappedDay = month;
			month = day;
			day = swappedDay;
		}

		let hour12 = Number(dmyAmPm[4] || '0');
		if (amPm) {
			if (hour12 === 12) {
				hour12 = 0;
			}
			hour12 = amPm === 'PM' ? hour12 + 12 : hour12;
		} else if (dmyAmPm[4]) {
			// If AM/PM is not provided, treat as 24-hour input (e.g. 13:30).
			hour12 = Number(dmyAmPm[4]);
		}

		if (month < 1 || month > 12 || day < 1 || day > 31 || minute < 0 || minute > 59 || hour12 < 0 || hour12 > 23) {
			return null;
		}

		return {
			year,
			month,
			day,
			hour: hour12,
			minute,
		};
	}

	// Matches: YYYY-MM-DD, YYYY-MM-DDTHH:mm, YYYY-MM-DD HH:mm, with optional seconds/timezone
	const isoLike = normalized.match(
		/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2})?)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
	);

	if (isoLike) {
		return {
			year: Number(isoLike[1]),
			month: Number(isoLike[2]),
			day: Number(isoLike[3]),
			hour: Number(isoLike[4] || '0'),
			minute: Number(isoLike[5] || '0'),
		};
	}

	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return {
		year: parsed.getFullYear(),
		month: parsed.getMonth() + 1,
		day: parsed.getDate(),
		hour: parsed.getHours(),
		minute: parsed.getMinutes(),
	};
}

function formatKhmerCeremonyDate(rawDate: string) {
	const parts = parseDateTimeParts(rawDate);
	if (!parts) {
		return rawDate;
	}

	const weekdays = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
	const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
	if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) {
		return rawDate;
	}

	const weekdayDate = new Date(parts.year, parts.month - 1, parts.day);

	const weekday = weekdays[weekdayDate.getDay()];
	const day = toKhmerDigits(parts.day);
	const month = months[parts.month - 1];
	if (!month) {
		return rawDate;
	}
	const year = toKhmerDigits(parts.year);

	const hours24 = parts.hour;
	const minutes = toKhmerDigits(String(parts.minute).padStart(2, '0'));
	const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
	const displayHour = toKhmerDigits(hours12);

	let period = 'ព្រឹក';
	if (hours24 >= 12 && hours24 < 17) {
		period = 'រសៀល';
	} else if (hours24 >= 17 && hours24 < 20) {
		period = 'ល្ងាច';
	} else if (hours24 >= 20) {
		period = 'យប់';
	}

	return `ថ្ងៃ${weekday} ទី${day} ខែ${month} ឆ្នាំ${year} វេលាម៉ោង ${displayHour}:${minutes} ${period}`;
}

function pickDisplayNames(eventTitle: string, eventSubtitle: string, language: BuilderState['language']) {
	const subtitle = eventSubtitle.trim();
	if (subtitle) {
		return subtitle;
	}

	const cleaned = eventTitle
		.replace('ពិធីរៀបមង្គលការ ', '')
		.replace('សិរីមង្គលអាពាហ៍ពិពាហ៍', '')
		.trim();

	if (!cleaned) {
		return language === 'en' ? 'Bride & Groom' : 'កូនកំលោះ និង កូនក្រមុំ';
	}

	const khmerOnly = cleaned
		.replace(/[A-Za-z0-9]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	const englishOnly = cleaned
		.replace(/[\u1780-\u17FF]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	const invalidKhmerOnly = khmerOnly === '' || khmerOnly === 'និង';
	const invalidEnglishOnly = englishOnly === '' || /^and$/i.test(englishOnly);

	if (language === 'en') {
		return invalidEnglishOnly ? cleaned : englishOnly;
	}

	return invalidKhmerOnly ? cleaned : khmerOnly;
}

function splitCoupleNames(displayNames: string) {
	const normalized = displayNames.replace(/\s+/g, ' ').trim();
	if (!normalized) {
		return null;
	}

	const parts = normalized
		.split(/\s*(?:និង|&|and)\s*/i)
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length < 2) {
		return null;
	}

	return {
		left: parts[0],
		right: parts.slice(1).join(' '),
	};
}

export default function ImageCover({ data }: ImageCoverProps) {
	const searchParams = useSearchParams();
	const guestName = searchParams.get('g') || 'ឈ្មោះភ្ញៀវកិត្តិយស';
	const names = pickDisplayNames(data.eventTitle || '', data.eventSubtitle || '', data.language);
	const coupleNames = splitCoupleNames(names);
	const showCeremonyTitle = data.language === 'km';
	const invitationText = data.language === 'en' ? 'You are cordially invited' : 'សូមគោរពអញ្ជើញ';
	const dateLabel = data.language === 'en' ? 'Date & Time' : 'កាលបរិច្ឆេទ និង ម៉ោង';
	const locationLabel = data.language === 'en' ? 'Location' : 'ទីតាំង';
	const khmerDateText = data.eventDate ? formatKhmerCeremonyDate(data.eventDate) : '';

	return (
		<section className="relative h-160 w-full overflow-hidden rounded-t-[32px] bg-black/10">
			{data.coverImageUrl ? (
				<img
					src={data.coverImageUrl}
					alt="cover"
					className="h-full w-full object-cover object-top scale-105"
				/>
			) : (
				<div className="h-full w-full bg-linear-to-b from-[#c8a56c] via-[#9a6f3f] to-[#5f3f23]" />
			)}

			<div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/45 to-black/65" />

			<div className="absolute inset-0 mx-auto flex max-w-85 flex-col items-center px-5 pb-9 pt-10 text-center sm:max-w-105 sm:px-8 sm:pb-12" style={{ color: data.textColor }}>
				{showCeremonyTitle && (
					<p className="font-khmer-heading text-[1.45rem] font-bold leading-tight tracking-wide sm:text-[1.7rem]">
						សិរីមង្គលអាពាហ៍ពិពាហ៍
					</p>
				)}
				{showCeremonyTitle && (
					<img
						src="/underline-kbach-1.png"
						alt=""
						aria-hidden="true"
						className="mt-1.5 w-24 object-contain opacity-80 sm:w-32"
					/>
				)}
				<p className={`${showCeremonyTitle ? 'mt-2' : 'mt-6'} font-khmer-heading text-[0.95rem] font-semibold leading-tight tracking-[0.02em] sm:text-[1.1rem]`}>
					{coupleNames ? (
						<span className="inline-flex items-center gap-2 sm:gap-3">
							<span>{coupleNames.left}</span>
							<span aria-hidden="true" className="text-[0.82em] text-[#ffb347]">❤</span>
							<span>{coupleNames.right}</span>
						</span>
					) : (
						names
					)}
				</p>

				<button
					type="button"
					className={`${data.language === 'km' ? 'mt-5 relative top-24 text-base sm:text-lg font-khmer-heading' : 'mt-5 text-[0.84rem] font-khmer-body'} px-1 py-0 font-medium tracking-wide text-current`}
				>
					{invitationText}
				</button>

				<div className="relative -mt-9 flex flex-col items-center justify-center">
					<img src="/frame.png" alt="badge-frame" className="h-auto w-64 object-contain sm:w-72" />
					<div className={`${data.language === 'km' ? 'font-khmer-heading text-base sm:text-lg' : 'font-khmer-body text-[0.95rem] sm:text-base'} absolute rounded-full px-4 py-1.5 font-semibold whitespace-nowrap`}>
						<span>{guestName}</span>
					</div>
				</div>

				{data.language === 'km' && data.eventDate && (
					<p className="absolute bottom-3 left-1/2 z-10 w-[92%] -translate-x-1/2 rounded-md bg-black/30 px-2 py-1 text-center font-khmer-body text-xs text-current sm:bottom-4 sm:w-auto sm:px-3">
						កាលបរិច្ឆេទពិធី: {khmerDateText}
					</p>
				)}
			</div>
		</section>
	);
}
