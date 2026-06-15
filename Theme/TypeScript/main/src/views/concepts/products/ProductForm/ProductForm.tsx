import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Container from '@/components/shared/Container'
import BottomStickyBar from '@/components/template/BottomStickyBar'
import GeneralSection from './components/GeneralSection'
import PricingSection from './components/PricingSection'
import ImageSection from './components/ImageSection'
import AttributeSection from './components/AttributeSection'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import isEmpty from 'lodash/isEmpty'
import type { ProductFormSchema } from './types'
import type { CommonProps } from '@/@types/common'

type ProductFormProps = {
    onFormSubmit: (values: ProductFormSchema) => void
    defaultValues?: ProductFormSchema
    newProduct?: boolean
} & CommonProps

const validationSchema = z.object({
    name: z.string().min(1, { message: 'نام محصول ضروری است!' }),
    productCode: z.string().min(1, { message: 'کد محصول ضروری است!' }),
    description: z
        .string()
        .min(1, { message: 'توضیحات محصول ضروری است!' }),
    price: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'قیمت ضروری است!',
        }),
    taxRate: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'نرخ مالیات ضروری است!',
        }),
    costPerItem: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'هزینه هر واحد ضروری است!',
        }),
    bulkDiscountPrice: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'قیمت تخفیف عمده ضروری است!',
        }),
    imgList: z
        .array(
            z.object({
                id: z.string(),
                name: z.string(),
                img: z.string(),
            }),
        )
        .min(1, { message: 'حداقل یک تصویر ضروری است!' }),
    category: z.string().min(1, { message: 'دسته‌بندی محصول ضروری است!' }),
})


const ProductForm = (props: ProductFormProps) => {
    const {
        onFormSubmit,
        defaultValues = {
            imgList: [],
        },
        children,
    } = props

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<ProductFormSchema>({
        defaultValues: {
            ...defaultValues,
        },
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues)])

    const onSubmit = (values: ProductFormSchema) => {
        onFormSubmit?.(values)
    }

    return (
        <Form
            className="flex w-full h-full"
            containerClassName="flex flex-col w-full justify-between"
            onSubmit={handleSubmit(onSubmit)}
        >
            <Container>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="gap-4 flex flex-col flex-auto">
                        <GeneralSection control={control} errors={errors} />
                        <PricingSection control={control} errors={errors} />
                    </div>
                    <div className="lg:min-w-[440px] 2xl:w-[500px] gap-4 flex flex-col">
                        <ImageSection control={control} errors={errors} />
                        <AttributeSection control={control} errors={errors} />
                    </div>
                </div>
            </Container>
            <BottomStickyBar>{children}</BottomStickyBar>
        </Form>
    )
}

export default ProductForm
