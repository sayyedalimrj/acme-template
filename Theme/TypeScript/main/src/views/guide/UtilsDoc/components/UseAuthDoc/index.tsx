import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseAuthDoc/'

const demoHeader = {
    title: 'useAuth',
    desc: 'هوکی که به هر کامپوننت این امکان را می‌دهد که وضعیت و متدهای احراز هویت و کاربران فعلی را دریافت کند.',
}

const demos = [
    {
        mdName: 'Example',
        mdPath: mdPath,
        title: 'مثال',
        desc: ``,
        component: <Example />,
    },
]

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="return"
        api={[
            {
                api: [
                    {
                        propName: 'authenticated',
                        type: `<code>boolean</code>`,
                        default: `-`,
                        desc: 'وضعیت احراز هویت فعلی',
                    },
                    {
                        propName: 'oAuthSignIn',
                        type: `<code>(callback: (payload: {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}) => void) => void</code>`,
                        default: `-`,
                        desc: 'تابع callback پس از ورود یک‌باره',
                    },
                    {
                        propName: 'signIn',
                        type: `<code>({email: string, password: string}) => ({status: 'success' | 'failed', message: string})</code>`,
                        default: `-`,
                        desc: 'مدیریت ورود، وضعیت و پیام را به عنوان نتیجه برمی‌گرداند',
                    },
                    {
                        propName: 'signOut',
                        type: `<code>() => void</code>`,
                        default: `-`,
                        desc: 'مدیریت خروج',
                    },
                    {
                        propName: 'signUp',
                        type: `<code>({userName: string, email: string, password: string}) => ({status: 'success' | 'failed', message: string})</code>`,
                        default: `-`,
                        desc: 'مدیریت ثبت‌نام، وضعیت و پیام را به عنوان نتیجه برمی‌گرداند',
                    },
                    {
                        propName: 'user',
                        type: `<code>{
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    authority?: string[]
}</code>`,
                        default: `-`,
                        desc: 'اطلاعات کاربر وارد شده',
                    },
                ],
            },
        ]}
    />
)

const UseAuthDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="utils"
            extra={extra}
            keyText="param"
        />
    )
}

export default UseAuthDoc
