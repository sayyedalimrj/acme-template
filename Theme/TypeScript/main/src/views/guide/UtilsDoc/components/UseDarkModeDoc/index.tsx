import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseDarkModeDoc'

const demoHeader = {
    title: 'useDarkMode',
    desc: 'این هوک به مدیریت حالت تاریک یا روشن در برنامه کمک می‌کند.',
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

const extra = (
    <DemoComponentApi
        hideApiTitle
        keyText="بازگشت"
        api={[
            {
                api: [
                    {
                        propName: 'isDark',
                        type: `<code>boolean</code>`,
                        default: `-`,
                        desc: 'آیا حالت فعلی حالت تاریک است',
                    },
                    {
                        propName: 'setIsDark',
                        type: `<code>(mode: 'dark' | 'light') => void</code>`,
                        default: `-`,
                        desc: 'تنظیم‌کننده حالت',
                    },
                ],
            },
        ]}
    />
)

const UseDarkModeDoc = () => {
    return (
        <DemoLayout
            hideApiTitle
            hideFooter
            innerFrame={false}
            header={demoHeader}
            demos={demos}
            mdPrefixPath="utils"
            extra={extra}
            keyText="پارامتر"
        />
    )
}

export default UseDarkModeDoc
