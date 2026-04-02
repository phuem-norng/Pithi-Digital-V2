export type EventFlowType = 'WEDDING' | 'CEREMONY' | 'BIRTHDAY' | 'HOUSEWARMING';

export interface EventCategoryOption {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  defaultEventType: EventFlowType;
}

export const EVENT_CATEGORY_OPTIONS: EventCategoryOption[] = [
  {
    key: 'wedding',
    title: 'Wedding',
    subtitle: 'អាពាហ៍ពិពាហ៍',
    description: 'ពិធីមង្គលការ និងពិធីទទួលភ្ញៀវ',
    defaultEventType: 'WEDDING',
  },
  {
    key: 'birthday',
    title: 'Birthday',
    subtitle: 'ខួបកំណើត',
    description: 'កម្មវិធីអបអរខួបកំណើតគ្រប់វ័យ',
    defaultEventType: 'BIRTHDAY',
  },
  {
    key: 'housewarming',
    title: 'Housewarming',
    subtitle: 'ឡើងផ្ទះ',
    description: 'កម្មវិធីឡើងគេហដ្ឋានថ្មី',
    defaultEventType: 'HOUSEWARMING',
  },
  {
    key: 'party',
    title: 'Party',
    subtitle: 'ជប់លៀង',
    description: 'កម្មវិធីជប់លៀងក្រុមគ្រួសារ និងមិត្តភក្តិ',
    defaultEventType: 'BIRTHDAY',
  },
  {
    key: 'money-forest-festival',
    title: 'Money Forest Festival',
    subtitle: 'បុណ្យផ្កាប្រាក់',
    description: 'ពិធីបុណ្យផ្កាប្រាក់ និងសប្បុរសធម៌',
    defaultEventType: 'CEREMONY',
  },
];

export const EVENT_CATEGORY_BY_KEY = EVENT_CATEGORY_OPTIONS.reduce<Record<string, EventCategoryOption>>(
  (accumulator, category) => {
    accumulator[category.key] = category;
    return accumulator;
  },
  {},
);