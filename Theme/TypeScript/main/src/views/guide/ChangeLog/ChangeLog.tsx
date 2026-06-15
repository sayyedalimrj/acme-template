import Container from '@/components/shared/Container'
import type { ReactNode } from 'react'

type Log = {
    version: string
    date: string
    updateContent: string[]
}

type LogProps = Omit<Log, 'updateContent'> & {
    border?: boolean
    children?: ReactNode
}

const logDataFa = [
    {
        version: '1.3.10',
        date: '۳۱ فروردین ۱۴۰۵',
        updateContent: [
            `[رفع مشکل] آسیب‌پذیری وابستگی‌ها`,
        ],
    },
    {
        version: '1.3.9',
        date: '۱۰ اسفند ۱۴۰۴',
        updateContent: [
            `[رفع مشکل] آسیب‌پذیری وابستگی‌ها`,
        ],
    },
    {
        version: '1.3.8',
        date: '۶ بهمن ۱۴۰۴',
        updateContent: [
            `[رفع مشکل] مشکل z-index در گروه ورودی`,
            `[افزوده شد] کامپوننت چرخ فلک (Carousel)`,
        ],
    },
    {
        version: '1.3.7',
        date: '۱۰ آذر ۱۴۰۴',
        updateContent: [
            `[رفع مشکل] تغییر مسیر خودکار / انجام نمی‌شد.`,
            `[رفع مشکل] مشکل onBlur در RichTextEditor در IssueBody`,
        ],
    },
    {
        version: '1.3.6',
        date: '۸ آبان ۱۴۰۴',
        updateContent: [
            `[رفع مشکل] مشکل نوع (Type) در هوک useInfiniteScroll.`,
            `[رفع مشکل] ترتیب مسیر عمومی و مسیر محافظت‌شده.`,
            `[رفع مشکل] آسیب‌پذیری وابستگی‌های npm.`,
        ],
    },
    {
        version: '1.3.5',
        date: '۷ مهر ۱۴۰۴',
        updateContent: [
            `[رفع اشکال] کار نکردن نادرست اسلایدر در حالت راست‌به‌چپ (RTL).`,
            `[رفع اشکال] ناهماهنگی در چینش مرز منوی SideNav در حالت RTL.`,
            `[رفع اشکال] بسته شدن فوری منوی کناری صفحه فرود در حالت موبایل پس از باز شدن.`,
            `[رفع اشکال] پاک شدن تاریخچه چت هوش مصنوعی هنگام بستن پنل تاریخچه در موبایل.`,
            `[افزوده شد] پراپ 'lockView' به کامپوننت‌های Datepicker و Calendar برای جلوگیری از تغییر نما.`,
        ],
    },
    {
        version: '1.3.4',
        date: '۷ شهریور ۱۴۰۴',
        updateContent: [
            `[رفع اشکال] استفاده از زاد (zod) منسوخ.`,
            `[رفع اشکال] تعریف اضافی و غیرضروری ZodType.`,
            `[به‌روزرسانی] بروزرسانی برخی وابستگی‌ها به آخرین نسخه‌ها.`,
            `[به‌روزرسانی] ارتقای @hookform/resolvers به نسخه ۵.۲.۱.`,
            `[به‌روزرسانی] ارتقای zod به نسخه ۴.۱.۱.`,
        ],
    },
    {
        version: '1.3.3',
        date: '۱ مرداد ۱۴۰۴',
        updateContent: [
            `[رفع اشکال] عدم عملکرد BottomStickyBar در کامپوننت OrderForm.`,
            `[رفع اشکال] کار نکردن نوار اسکرول در StackedSideNavSecondary.`,
            `[به‌روزرسانی] بروزرسانی برخی وابستگی‌ها به آخرین نسخه‌ها.`,
            `[به‌روزرسانی] ارتقای vite به نسخه ۷.۰.۵.`,
        ],
    },
    {
        version: '1.3.2',
        date: '۴ تیر ۱۴۰۴',
        updateContent: [
            `[افزوده شد] پراپ Indeterminate به کامپوننت Checkbox.`,
        ],
    },
    {
        version: '1.3.1',
        date: '۱ خرداد ۱۴۰۴',
        updateContent: [
            `[رفع اشکال] نبود تصویر مربوط به «بدون اعلان».`,
            `[رفع اشکال] مشکلات اندازه‌دهی در ورودی‌های متنی (textarea).`,
            `[افزوده شد] کامپوننت اسلایدر.`,
            `[به‌روزرسانی] ارتقای vite به نسخه ۶.۳.۵.`,
        ],
    },
    {
        version: '1.3.0',
        date: '۷ اردیبهشت ۱۴۰۴',
        updateContent: [
            `[رفع اشکال] بروزرسانی نشدن توکن در AuthProvider.`,
            `[رفع اشکال] مشکلات ترتیب Z-index بین کامپوننت‌های Dialog، Drawer، Select و Header.`,
            `[رفع اشکال] عدم عملکرد prop مربوط به pauseOnHover در کامپوننت InfiniteMovingCards.`,
            `[به‌روزرسانی] بروزرسانی react-router به نسخه ۷ و جایگزینی با react-router-dom.`,
        ],
    },
    {
        version: '1.2.2',
        date: '۱۵ فروردین ۱۴۰۴',
        updateContent: [
            `[افزوده‌شده] نسخه JavaScript قالب.`,
            `[رفع اشکال] مشکلات استایل hover برای Checkbox غیرفعال.`,
            `[رفع اشکال] مشکلات تراز فرم به‌صورت inline.`,
            `[رفع اشکال] مشکل بسته نشدن خودکار کامپوننت Datepicker.`,
            `[رفع اشکال] مشکلات override شدن کلاس‌ها در Switcher.`,
        ],
    },
    {
        version: '1.2.1',
        date: '۲۳ اسفند ۱۴۰۳',
        updateContent: [
            `[افزوده‌شده] صفحه فرود (Landing page).`,
            `[رفع اشکال] مشکلات استایل focus در کامپوننت Datepicker.`,
            `[رفع اشکال] مشکلات کنتراست ورودی در کامپوننت Select.`,
            `[به‌روزرسانی] بروزرسانی وابستگی‌های مختلف به آخرین نسخه‌ها.`,
        ],
    },
    {
        version: '1.2.0',
        date: '۴ اسفند ۱۴۰۳',
        updateContent: [
            `[به‌روزرسانی] ارتقاء Tailwind به نسخه ۴.`,
            `[به‌روزرسانی] بروزرسانی وابستگی‌های مختلف به آخرین نسخه‌ها.`,
            `[تغییرات] اعمال لایه‌ها بر CSS موجود.`,
            `[رفع اشکال] مشکلات جزئی استایل.`,
        ],
    },
    {
        version: '1.1.2',
        date: '۷ بهمن ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] ناهم‌راستایی تصویر آپلود آیتم.`,
            `[رفع اشکال] نمایش ندادن عنوان منو هنگام بیشتر از یک سطح cascade.`,
            `[رفع اشکال] حذف override وابستگی‌ها برای برخی کتابخانه‌ها.`,
        ],
    },
    {
        version: '1.1.1',
        date: '۱۸ دی ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] هایلایت نشدن آیتم منو در حالت فشرده (collapsed) در SideNav.`,
        ],
    },
    {
        version: '1.1.0',
        date: '۱۷ دی ۱۴۰۳',
        updateContent: [
            `[به‌روزرسانی] ارتقاء React به نسخه ۱۹.`,
            `[به‌روزرسانی] بروزرسانی وابستگی‌های مختلف به آخرین نسخه‌ها.`,
            `[رفع اشکال] جمع شدن منوی عمودی در حالت موبایل.`,
            `[رفع اشکال] بررسی نشدن احراز هویت در کامپوننت VeritcalMenuContent.`,
            `[رفع اشکال] شباهت ظاهری گزینه غیرفعال در Select با گزینه عادی.`,
            `[رفع اشکال] غیرفعال شدن Eslint پس از ارتقاء به نسخه ۹.`,
        ],
    },
    {
        version: '1.0.8',
        date: '۲۵ آذر ۱۴۰۳',
        updateContent: [
            `[به‌روزرسانی] بروزرسانی وابستگی‌های مختلف به آخرین نسخه‌ها.`,
            `[افزوده‌شده] فیلد جدید 'activeNavTranslation' به app config.tsx برای کنترل فعال بودن ترجمه ناوبری.`,
            `[رفع اشکال] اشتباه تایپی در کلید ترجمه و ترجمه‌های ناقص در نسخه demo.`,
            `[رفع اشکال] هشدار prop مربوط به fullWidth در کامپوننت DatePicker.`,
            `[تغییرات] ماژول Locales به‌صورت پیش‌فرض در بسته شروع حذف شده است.`,
            `[تغییرات] تغییر نام hook از 'useTheme' به 'useThemeSchema'.`,
        ],
    },
    {
        version: '1.0.7',
        date: '۲۷ آبان ۱۴۰۳',
        updateContent: [`[رفع اشکال] رندر مجدد اضافی در کامپوننت PostLoginLayout.`],
    },
    {
        version: '1.0.6',
        date: '۱۸ آبان ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] مقداردهی اولیه نکردن hook مربوط به useDirection در کامپوننت Theme.`,
        ],
    },
    {
        version: '1.0.5',
        date: '۱۰ آبان ۱۴۰۳',
        updateContent: [
            `[افزوده‌شده] کامپوننت OtpInput.`,
            `[افزوده‌شده] صفحات احراز هویت با تأیید OTP.`,
            `[رفع اشکال] کلاس‌های تکراری در کامپوننت‌های Button و Pagination.`,
            `[رفع اشکال] مشکلات تایپ کوچک در کامپوننت DateTable.`,
        ],
    },
    {
        version: '1.0.4',
        date: '۲۷ مهر ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] عدم وجود فایل .env در نسخه‌های starter و demo.`,
            `[رفع اشکال] خروج متن خطا از کادر در صفحات احراز هویت هنگام طولانی بودن محتوا.`,
        ],
    },
    {
        version: '1.0.3',
        date: '۱۶ مهر ۱۴۰۳',
        updateContent: [`[رفع اشکال] عدم تغییر اندازه نمودار هنگام تغییر اندازه والد.`],
    },
    {
        version: '1.0.2',
        date: '۱۰ مهر ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] عدم نمایش پنل تنظیمات در چیدمان blank.`,
        ],
    },
    {
        version: '1.0.1',
        date: '۶ مهر ۱۴۰۳',
        updateContent: [
            `[رفع اشکال] دریافت توکن از localStorage به‌جای sessionStorage هنگام استفاده از accessTokenPersistStrategy برابر با 'sessionStorage'.`,
        ],
    },
    {
        version: '1.0.0',
        date: '۵ مهر ۱۴۰۳',
        updateContent: ['[انتشار] نسخه اولیه منتشر شد.'],
    },
]


const Log = (props: LogProps) => {
    return (
        <div className={`py-4 ${props.border && 'border-bottom'}`}>
            <div className="flex items-center">
                <h5 className="font-weight-normal mb-0 me-3">
                    {props.version}
                </h5>
                <span>{props.date}</span>
            </div>
            <div className="api-container p-0 border-0 mt-3">
                {props.children}
            </div>
        </div>
    )
}

const Changelog = () => {
    return (
        <Container>
            <div>
                <h4>تاریخچه تغییرات</h4>
                {logDataFa.map((elm) => (
                    <Log
                        key={elm.version}
                        version={`v${elm.version}`}
                        date={elm.date}
                    >
                        {elm.updateContent.length > 0 ? (
                            <ul>
                                {elm.updateContent.map((item, i) => (
                                    <li key={i}>- {item}</li>
                                ))}
                            </ul>
                        ) : null}
                    </Log>
                ))}
            </div>
        </Container>
    )
}

export default Changelog
