import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseAuthorityDoc'

const demoHeader = {
    title: 'useAuthority',
    desc: 'هوک useAuthority به بررسی این که آیا کاربر فعلی اجازه دسترسی دارد کمک می‌کند.',
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
                propName: 'userAuthority',
                type: `<code>Array</code>`,
                default: `<code>[]</code>`,
                desc: 'لیست نقش‌های کاربر',
            },
            {
                propName: 'authority',
                type: `<code>Array</code>`,
                default: `<code>[]</code>`,
                desc: 'لیست نقش‌هایی که اجازه دسترسی دارند',
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
                        propName: 'roleMatched',
                        type: `<code>boolean</code>`,
                        default: `-`,
                        desc: 'نتیجه تطابق اختیارات',
                    },
                ],
            },
        ]}
    />
)

const UseAuthorityDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            api={demoApi}
            mdPrefixPath="utils"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default UseAuthorityDoc
