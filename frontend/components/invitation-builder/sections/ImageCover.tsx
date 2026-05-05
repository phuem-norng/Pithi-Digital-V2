'use client';

import { useSearchParams } from 'next/navigation';
import type { BuilderState } from '../types';
import { Assets } from '@/lib/assets';
import { FLORAL_ROSE_WEDDING_TEMPLATE_ID } from '@/lib/template-style';
import { cn } from '@/lib/utils';

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

	// Keep a shared separator token so splitCoupleNames can still detect
	// groom/bride names after language-specific character filtering.
	const normalizedSeparators = cleaned
		.replace(/\s+និង\s+/gu, ' & ')
		.replace(/\s+and\s+/giu, ' & ');

	if (!cleaned) {
		return language === 'en' ? 'Bride & Groom' : 'កូនកំលោះ និង កូនក្រមុំ';
	}

	// Keep names identical across languages; only labels should be translated.
	return normalizedSeparators.replace(/\s+/g, ' ').trim();
}

function splitCoupleNames(displayNames: string) {
	const normalized = displayNames.replace(/\s+/g, ' ').trim();
	if (!normalized) {
		return null;
	}

	const parts = normalized
		.split(/\s*(?:និង|&|and)\s*/i)
		.map((part) =>
			part
				// Remove accidental decorative hearts from source text to avoid duplicate hearts in UI.
				.replace(/[❤♡♥️💖💗💘💝💞💓💟]/gu, '')
				.trim(),
		)
		.filter(Boolean);

	if (parts.length < 2) {
		return null;
	}

	return {
		left: parts[0],
		right: parts.slice(1).join(' '),
	};
}

function stripHeartDecorations(value: string) {
	return value.replace(/[❤♡♥️♥💖💗💘💝💞💓💟]/gu, '').replace(/\s+/g, ' ').trim();
}

export default function ImageCover({ data }: ImageCoverProps) {
	const searchParams = useSearchParams();
	const guestName = searchParams.get('g') || 'ឈ្មោះភ្ញៀវកិត្តិយស';
	const names = stripHeartDecorations(pickDisplayNames(data.eventTitle || '', data.eventSubtitle || '', data.language));
	const coupleNames = splitCoupleNames(names);
	const ceremonyTitle = data.language === 'en' ? 'Wedding celebration' : 'សិរីមង្គលអាពាហ៍ពិពាហ៍';
	const invitationText = data.language === 'en' ? 'You are cordially invited' : 'សូមគោរពអញ្ជើញ';
	const ceremonyDateLabel = data.language === 'en' ? 'Ceremony date:' : 'កាលបរិច្ឆេទពិធី:';
	const eventDateDisplay = data.eventDate;

	const isFloralRoseShowcaseCover = data.templateId === FLORAL_ROSE_WEDDING_TEMPLATE_ID;
	/** Cover text color for Floral Rose showcase (title, names, invite line, guest). */
	const showcaseGold = {
		main: data.textColor || '#e6c628',
		heart: data.headingColor || '#ffb347',
		/** Soft black hugging the glyphs (not a heavy halo). */
		shadow: '0 1px 1px rgba(0, 0, 0, 0.22), 0 2px 5px rgba(0, 0, 0, 0.12)',
	} as const;
	const showcaseDateColor = data.headingColor || '#5E3A26';

	return (
		<section
			className={cn(
				'relative h-160 w-full overflow-hidden rounded-t-[32px]',
				isFloralRoseShowcaseCover ? 'bg-[#eecfaf]' : 'bg-black/10',
			)}
		>
			{data.coverImageUrl ? (
				<img
					src={data.coverImageUrl}
					alt="cover"
					className="h-full w-full object-cover object-top scale-105"
				/>
			) : (
				<div
					className={
						isFloralRoseShowcaseCover
							? 'h-full w-full bg-linear-to-b from-[#f8ebd8] via-[#eecfaf] to-[#e2c29a]'
							: 'h-full w-full bg-linear-to-b from-[#c8a56c] via-[#9a6f3f] to-[#5f3f23]'
					}
				/>
			)}

			<div
				className={
					isFloralRoseShowcaseCover
						? 'absolute inset-0 bg-linear-to-b from-white/30 via-[#5e3a26]/12 to-[#eecfaf]/95'
						: 'absolute inset-0 bg-linear-to-b from-black/30 via-black/45 to-black/65'
				}
			/>

			<div
				className="absolute inset-0 mx-auto flex max-w-85 flex-col items-center px-5 pb-9 pt-10 text-center sm:max-w-105 sm:px-8 sm:pb-12"
				style={
					isFloralRoseShowcaseCover
						? { color: showcaseGold.main, textShadow: showcaseGold.shadow }
						: { color: data.textColor }
				}
			>
				<div className="flex w-full flex-col items-center">
					<p className="w-full text-center font-khmer-heading text-[1.45rem] font-bold leading-tight tracking-wide sm:text-[1.7rem]">
						{ceremonyTitle}
					</p>
					<img
						src={Assets.underlineKbach}
						alt=""
						aria-hidden="true"
						className={cn(
							'mt-1.5 block h-auto w-24 max-w-full shrink-0 object-contain sm:w-32',
							isFloralRoseShowcaseCover ? 'opacity-95 [filter:sepia(0.35)_saturate(1.2)_hue-rotate(-8deg)]' : 'opacity-80',
						)}
					/>
					<p
						className={cn(
							'mt-2 w-full max-w-md font-khmer-heading text-[0.95rem] font-semibold leading-tight tracking-[0.02em] sm:text-[1.1rem]',
							coupleNames
								? 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-3'
								: 'text-center',
						)}
					>
						{coupleNames ? (
							<>
								<span className="min-w-0 truncate text-end">{coupleNames.left}</span>
								<span
									aria-hidden="true"
									className={cn(
										'justify-self-center text-[0.9em] leading-none',
										!isFloralRoseShowcaseCover && 'text-[#ffb347]',
									)}
									style={
										isFloralRoseShowcaseCover
											? {
												color: showcaseGold.heart,
												textShadow: showcaseGold.shadow,
												fontVariantEmoji: 'text',
											}
											: undefined
									}
								>
									{'\u2665\uFE0E'}
								</span>
								<span className="min-w-0 truncate text-start">{coupleNames.right}</span>
							</>
						) : (
							names
						)}
					</p>
				</div>

				<button
					type="button"
					className="relative top-20 mt-4 px-1 py-0 font-khmer-heading text-base font-medium tracking-wide text-current sm:text-lg"
					style={isFloralRoseShowcaseCover ? { color: showcaseGold.main, textShadow: showcaseGold.shadow } : undefined}
				>
					{invitationText}
				</button>

				<div className="relative -mt-16 flex flex-col items-center justify-center">
					<img src={Assets.guestNameFrame} alt="" aria-hidden="true" className="h-auto w-64 object-contain sm:w-72" />
					<div
						className="absolute translate-y-1.5 rounded-full px-4 py-1.5 font-khmer-heading text-base font-semibold whitespace-nowrap sm:translate-y-2 sm:text-lg"
						style={isFloralRoseShowcaseCover ? { color: showcaseGold.main, textShadow: showcaseGold.shadow } : undefined}
					>
						<span>{guestName}</span>
					</div>
				</div>

				{data.eventDate && (
					<p
						className={cn(
							'absolute bottom-3 left-1/2 z-10 w-[92%] -translate-x-1/2 px-2 py-1 text-center font-khmer-body text-xs sm:bottom-4 sm:w-auto sm:px-3',
							isFloralRoseShowcaseCover
								? ''
								: 'text-current',
						)}
						style={
							isFloralRoseShowcaseCover
								? { color: showcaseDateColor, textShadow: showcaseGold.shadow }
								: undefined
						}
					>
						{ceremonyDateLabel} {eventDateDisplay}
					</p>
				)}
			</div>
		</section>
	);
}
