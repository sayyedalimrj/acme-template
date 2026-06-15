import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'
// Demo
import Example from './Example'

const mdPath = 'UseInfiniteScrollDoc/'

const demoHeader = {
    title: 'useInfiniteScroll',
    desc: 'هوک useInfiniteScroll راهی راحت برای پیاده‌سازی اسکرول بی‌پایان در یک کامپوننت React را فراهم می‌کند.',
}

const demos = [
    {
        mdName: 'مثال',
        mdPath: mdPath,
        title: 'مثال',
        desc: ``,
        component: <Example />,
    },
]

const demoApi = [
    {
        component: 'پارامترها',
        api: [
            {
                propName: 'offset',
                type: `<code>string</code>`,
                default: `'0px'`,
                desc: 'فاصله از پایین کانتینر که در آن باید عمل بارگذاری بیشتر انجام شود.',
            },
            {
                propName: 'shouldStop',
                type: `<code>boolean</code>`,
                default: `false`,
                desc: 'پرچمی برای متوقف کردن اسکرول بی‌پایان از انجام اقدامات بارگذاری بیشتر.',
            },
            {
                propName: 'onLoadMore',
                type: `<code>() => Promise<void></code>`,
                default: `undefined`,
                desc: 'تابعی که باید زمانی که کاربر به پایین کانتینر می‌رسد، فراخوانی شود.',
            },
        ],
    },
]

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="بازگشت"
        api={[
            {
                component: 'بازگشت',
                api: [
                    {
                        propName: 'isLoading',
                        type: `<code>boolean</code>`,
                        default: '',
                        desc: 'نشان می‌دهد که آیا هوک در حال بارگذاری محتوای بیشتر است یا خیر.',
                    },
                    {
                        propName: 'containerRef',
                        type: `<code>LegacyRef<HTMLElement></code>`,
                        default: '',
                        desc: 'یک تابع callback ref که باید به کانتینری که نیاز به اسکرول بی‌پایان دارد، اختصاص یابد.',
                    },
                ],
            },
        ]}
    />
)

const UseInfiniteScrollDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="docs/SharedComponentsDoc/components"
            extra={extra}
            api={demoApi}
            keyText="پارامتر"
        />
    )
}

export default UseInfiniteScrollDoc
