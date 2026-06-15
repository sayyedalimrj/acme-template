import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'UseQueryDoc'

const demoHeader = {
    title: 'useQuery',
    desc: 'هوک useQuery بر اساس <a class="text-primary underline" href="https://reactrouter.com/docs/en/v6/hooks/use-location" target="_blank"><code>useLocation</code></a> ایجاد شده است تا رشته کوئری را تجزیه کند.',
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
                        propName: 'query',
                        type: `<a class="text-primary underline" href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams" target="_blank"><code>URLSearchParams</code></a>`,
                        default: `-`,
                        desc: 'یک نمونه از URLSearchParams با useLocation().search مقداردهی اولیه شده است.',
                    },
                ],
            },
        ]}
    />
)

const UseQueryDoc = () => {
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

export default UseQueryDoc
