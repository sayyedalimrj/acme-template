import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Basic from './Basic'
import Range from './Range'
import Disabled from './Disabled'
import SliderTootltip from './SliderTootltip'
import Marks from './Marks'
import Step from './Step'
import MinAndMax from './MinAndMax'
import CustomColor from './CustomColor'
import Controlled from './Controlled'

const mdPath = 'Slider'

const demoHeader = {
    title: 'اسلایدر',
    desc: 'اسلایدر برای انتخاب یک مقدار در یک بازه استفاده می‌شود.',
}

const demos = [
    {
        mdName: 'Basic',
        mdPath: mdPath,
        title: 'ساده',
        desc: `استفاده پایه از اسلایدر.`,
        component: <Basic />,
    },
    {
        mdName: 'Range',
        mdPath: mdPath,
        title: 'بازه‌ای',
        desc: `استفاده پایه از اسلایدر بازه‌ای.`,
        component: <Range />,
    },
    {
        mdName: 'Disabled',
        mdPath: mdPath,
        title: 'غیرفعال',
        desc: `با تنظیم prop غیرفعال، اسلایدر را غیرقابل استفاده کنید.`,
        component: <Disabled />,
    },
    {
        mdName: 'Tooltip',
        mdPath: mdPath,
        title: 'تولتیپ',
        desc: `اسلایدر امکان نمایش تولتیپ هنگام هاور یا همیشه را فراهم می‌کند.`,
        component: <SliderTootltip />,
    },
    {
        mdName: 'Marks',
        mdPath: mdPath,
        title: 'نشانگرها',
        desc: `اسلایدر می‌تواند با استفاده از prop <code>marks</code> نشانگرهایی زیر نوار داشته باشد.`,
        component: <Marks />,
    },
    {
        mdName: 'Step',
        mdPath: mdPath,
        title: 'گام',
        desc: `prop <code>step</code> به شما اجازه می‌دهد مقدار افزایش هنگام کشیدن اسلایدر را کنترل کنید و تعیین می‌کند اسلایدر چگونه بین مقادیر منظم حرکت کند. همچنین prop <code>stepOnMarks</code> اجازه حرکت بین مقادیر نامنظم را می‌دهد.`,
        component: <Step />,
    },
    {
        mdName: 'MinAndMax',
        mdPath: mdPath,
        title: 'حداقل و حداکثر',
        desc: `به طور پیش‌فرض، اسلایدر دارای مقدار حداقل ۰ و حداکثر ۱۰۰ است. با استفاده از prop های <code>min</code> و <code>max</code> می‌توانید مقادیر حداقل و حداکثر دلخواه را تعیین کنید.`,
        component: <MinAndMax />,
    },
    {
        mdName: 'CustomColor',
        mdPath: mdPath,
        title: 'رنگ سفارشی',
        desc: `می‌توانیم رنگ اسلایدر را با استفاده از prop <code>classNames</code> و اعمال کلاس به بخش‌های مختلف اسلایدر سفارشی کنیم.`,
        component: <CustomColor />,
    },
    {
        mdName: 'Controlled',
        mdPath: mdPath,
        title: 'کنترل‌شده',
        desc: `استفاده کنترل‌شده با <code>&lt;Slider /&gt;</code>`,
        component: <Controlled />,
    },
]

const demoApi = [
    {
        component: 'Slider',
        api: [
            {
                propName: 'alwaysShowTooltip',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'آیا تولتیپ همیشه نمایش داده شود یا خیر',
            },
            {
                propName: 'classNames',
                type: `<code>classNames?: { thumb?: string; bar?: string; mark?: string | ((isFilled: boolean) => string); track?: string }</code>`,
                default: `-`,
                desc: 'کلاس CSS برای هر بخش اسلایدر',
            },
            {
                propName: 'defaultValue',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'مقدار پیش‌فرض اسلایدر (در حالت کنترل‌شده از value استفاده کنید)',
            },
            {
                propName: 'disabled',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'آیا اسلایدر غیرفعال باشد یا خیر',
            },
            {
                propName: 'inputProps',
                type: `<code>React.ComponentPropsWithoutRef<'input'></code>`,
                default: `-`,
                desc: 'پراپ‌های ورودی برای المنت input پشت اسلایدر',
            },
            {
                propName: 'marks',
                type: `<code>{ value: number; label?: ReactNode | string }[]</code>`,
                default: `-`,
                desc: 'اطلاعات نشانگرها که زیر نوار نمایش داده می‌شوند',
            },
            {
                propName: 'max',
                type: `<code>number</code>`,
                default: `<code>100</code>`,
                desc: 'حداکثر مقدار اسلایدر',
            },
            {
                propName: 'min',
                type: `<code>number</code>`,
                default: `<code>0</code>`,
                desc: 'حداقل مقدار اسلایدر',
            },
            {
                propName: 'name',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'نام المنت input پشت اسلایدر',
            },
            {
                propName: 'onChange',
                type: `<code>(value: number) => void</code>`,
                default: `-`,
                desc: 'کال‌بک هنگام تغییر مقدار اسلایدر',
            },
            {
                propName: 'onDraggingStop',
                type: `<code>(value: number) => void</code>`,
                default: `-`,
                desc: 'کال‌بک هنگام توقف کشیدن اسلایدر',
            },
            {
                propName: 'precision',
                type: `<code>number</code>`,
                default: `<code>-</code>`,
                desc: 'دقت مقدار اسلایدر',
            },
            {
                propName: 'showTooltipOnHover',
                type: `<code>boolean</code>`,
                default: `<code>false</code>`,
                desc: 'آیا تولتیپ هنگام هاور نمایش داده شود یا خیر',
            },
            {
                propName: 'step',
                type: `<code>number</code>`,
                default: `<code>1</code>`,
                desc: 'مقدار افزایش هنگام کشیدن اسلایدر',
            },
            {
                propName: 'stepOnMarks',
                type: `<code>boolean</code>`,
                default: `<code>false</code>`,
                desc: 'آیا اسلایدر بین مقادیر نامنظم حرکت کند یا خیر',
            },
            {
                propName: 'thumbAriaLabel',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'برچسب aria برای دسته اسلایدر',
            },
            {
                propName: 'tooltip',
                type: `<code>ReactNode | ((value: number) => ReactNode)</code>`,
                default: `-`,
                desc: 'مقدار سفارشی تولتیپ اسلایدر',
            },
            {
                propName: 'value',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'مقدار اسلایدر',
            },
        ],
    },
    {
        component: 'Slider.Range',
        api: [
            {
                propName: 'alwaysShowTooltip',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'آیا تولتیپ همیشه نمایش داده شود یا خیر',
            },
            {
                propName: 'defaultValue',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'مقدار پیش‌فرض اسلایدر بازه‌ای (در حالت کنترل‌شده از value استفاده کنید)',
            },
            {
                propName: 'disabled',
                type: `<code>boolean</code>`,
                default: `-`,
                desc: 'آیا اسلایدر بازه‌ای غیرفعال باشد یا خیر',
            },
            {
                propName: 'inputProps',
                type: `<code>React.ComponentPropsWithoutRef<'input'></code>`,
                default: `-`,
                desc: 'پراپ‌های ورودی برای المنت input پشت اسلایدر',
            },
            {
                propName: 'marks',
                type: `<code>{ value: number; label?: ReactNode | string }[]</code>`,
                default: `-`,
                desc: 'اطلاعات نشانگرها که زیر نوار نمایش داده می‌شوند',
            },
            {
                propName: 'max',
                type: `<code>number</code>`,
                default: `<code>100</code>`,
                desc: 'حداکثر مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'maxRange',
                type: `<code>number</code>`,
                default: `-`,
                desc: 'بیشترین فاصله مجاز بین دو مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'min',
                type: `<code>number</code>`,
                default: `<code>0</code>`,
                desc: 'حداقل مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'minRange',
                type: `<code>number</code>`,
                default: `<code>0</code>`,
                desc: 'کمترین فاصله مجاز بین دو مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'name',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'نام المنت input پشت اسلایدر',
            },
            {
                propName: 'precision',
                type: `<code>number</code>`,
                default: `<code>-</code>`,
                desc: 'دقت مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'onChange',
                type: `<code>(values: [number, number]) => void</code>`,
                default: `-`,
                desc: 'کال‌بک هنگام تغییر مقدار اسلایدر بازه‌ای',
            },
            {
                propName: 'onDraggingStop',
                type: `<code>(values: [number, number]) => void</code>`,
                default: `-`,
                desc: 'کال‌بک هنگام توقف کشیدن اسلایدر بازه‌ای',
            },
            {
                propName: 'showTooltipOnHover',
                type: `<code>boolean</code>`,
                default: `<code>false</code>`,
                desc: 'آیا تولتیپ هنگام هاور نمایش داده شود یا خیر',
            },
            {
                propName: 'step',
                type: `<code>number</code>`,
                default: `<code>1</code>`,
                desc: 'مقدار افزایش هنگام کشیدن اسلایدر بازه‌ای',
            },
            {
                propName: 'stepOnMarks',
                type: `<code>boolean</code>`,
                default: `<code>false</code>`,
                desc: 'آیا اسلایدر بازه‌ای بین مقادیر نامنظم حرکت کند یا خیر',
            },
            {
                propName: 'thumbAriaLabelStart',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'برچسب aria برای دسته شروع اسلایدر بازه‌ای',
            },
            {
                propName: 'thumbAriaLabelEnd',
                type: `<code>string</code>`,
                default: `-`,
                desc: 'برچسب aria برای دسته پایان اسلایدر بازه‌ای',
            },
            {
                propName: 'tooltip',
                type: `<code>ReactNode | ((value: [number, number]) => ReactNode)</code>`,
                default: `-`,
                desc: 'مقدار سفارشی تولتیپ اسلایدر بازه‌ای',
            },
            {
                propName: 'value',
                type: `<code>[number, number]</code>`,
                default: `-`,
                desc: 'مقدار اسلایدر بازه‌ای',
            },
        ],
    },
]

const Segment = () => {
    return <DemoLayout header={demoHeader} demos={demos} api={demoApi} />
}

export default Segment
