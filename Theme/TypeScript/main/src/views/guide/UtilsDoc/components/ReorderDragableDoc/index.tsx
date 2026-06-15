import DemoComponentApi from '@/components/docs/DemoComponentApi'
import DemoLayout from '@/components/docs/DemoLayout'

// Demo
import Example from './Example'

const mdPath = 'ReorderDragableDoc'

const demoHeader = {
    title: 'reorderDragable',
    desc: '<p><code>reorderDragable</code> تابعی است که برای جابجایی اقلام درون یا بین نواحی قابل رها کردن در یک رابط کشیدن و رها کردن استفاده می‌شود و از ساختار <code>DraggableLocation</code> استفاده می‌کند.</p>',
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

const demoApi = [
    {
        component: 'پارامترها',
        api: [
            {
                propName: 'quoteMap',
                type: `<code>T extends Record&lt;string, unknown[]&gt;</code>`,
                default: `-`,
                desc: 'یک شیء که کلیدها نواحی قابل رها کردن مختلف (لیست‌ها) را نشان می‌دهند و مقادیر آرایه‌هایی از اقلام در هر یک هستند.',
            },
            {
                propName: 'source',
                type: `<code>{droppableId: string; index: number;}</code>`,
                default: `-`,
                desc: 'مکان شروع اقلام کشیده شده. این شامل droppableId و ایندکس عنصر است.',
            },
            {
                propName: 'destination',
                type: `<code>{droppableId: string; index: number;}</code>`,
                default: `-`,
                desc: 'مکان هدفی که عنصر در آن رها می‌شود، شامل droppableId و ایندکس.',
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
                        propName: 'quoteMap',
                        type: `<code>T</code>`,
                        desc: 'یک شیء جدید با لیست‌های به‌روز شده که اقلام دوباره مرتب شده را چه در همان لیست و چه بین لیست‌های مختلف نشان می‌دهد.',
                        default: `-`,
                    },
                ],
            },
        ]}
    />
)

const ReorderDragableDoc = () => {
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

export default ReorderDragableDoc
