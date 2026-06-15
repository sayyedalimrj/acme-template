import { lazy } from 'react'
import { DocumentationRoute } from '@/@types/docs'

const utilsDocRoutes: DocumentationRoute[] = [
    {
        groupName: 'هوک‌ها',
        nav: [
            {
                path: 'use-auth',
                label: 'استفاده از احراز هویت',
                component: lazy(() => import('./components/UseAuthDoc')),
            },
            {
                path: 'use-authority',
                label: 'استفاده از اختیارات',
                component: lazy(() => import('./components/UseAuthorityDoc')),
            },
            {
                path: 'use-dark-mode',
                label: 'حالت تاریک',
                component: lazy(() => import('./components/UseDarkModeDoc')),
            },
            {
                path: 'use-debounce',
                label: 'تأخیر',
                component: lazy(() => import('./components/UseDebounceDoc')),
            },
            {
                path: 'use-direction',
                label: 'جهت',
                component: lazy(() => import('./components/UseDirectionDoc')),
            },
            {
                path: 'use-infinite-scroll',
                label: 'اسکرول بی‌پایان',
                component: lazy(
                    () => import('./components/UseInfiniteScrollDoc'),
                ),
            },
            {
                path: 'use-interval',
                label: 'فاصله',
                component: lazy(() => import('./components/UseIntervalDoc')),
            },
            {
                path: 'use-layout',
                label: 'چیدمان',
                component: lazy(() => import('./components/UseLayoutDoc')),
            },
            {
                path: 'use-menu-active',
                label: 'فعال بودن منو',
                component: lazy(() => import('./components/UseMenuActiveDoc')),
            },
            {
                path: 'use-query',
                label: 'پرس و جو',
                component: lazy(() => import('./components/UseQueryDoc')),
            },
            {
                path: 'use-random-bg-color',
                label: 'رنگ پس‌زمینه تصادفی',
                component: lazy(
                    () => import('./components/UseRandomBgColorDoc'),
                ),
            },
            {
                path: 'use-responsive',
                label: 'واکنش‌گرا',
                component: lazy(() => import('./components/UseResponsiveDoc')),
            },
            {
                path: 'use-scroll-top',
                label: 'اسکرول به بالا',
                component: lazy(() => import('./components/UseScrollTopDoc')),
            },
            {
                path: 'use-time-out-message',
                label: 'پیام زمان‌دار',
                component: lazy(
                    () => import('./components/UseTimeOutMessageDoc'),
                ),
            },
            {
                path: 'use-translation',
                label: 'ترجمه',
                component: lazy(() => import('./components/UseTranslationDoc')),
            },
        ],
    },
    {
        groupName: 'توابع',
        nav: [
            {
                path: 'acronym',
                label: 'مخفف',
                component: lazy(() => import('./components/AcronymDoc')),
            },
            {
                path: 'classNames',
                label: 'نام‌های کلاس',
                component: lazy(() => import('./components/ClassNamesDoc')),
            },
            {
                path: 'cookies-storage',
                label: 'ذخیره‌سازی کوکی‌ها',
                component: lazy(() => import('./components/CookiesStorageDoc')),
            },
            {
                path: 'file-size-unit',
                label: 'واحد اندازه فایل',
                component: lazy(() => import('./components/FileSizeUnitDoc')),
            },
            {
                path: 'is-last-child',
                label: 'آخرین فرزند است',
                component: lazy(() => import('./components/IsLastChildDoc')),
            },
            {
                path: 'paginate',
                label: 'صفحه‌بندی',
                component: lazy(() => import('./components/PaginateDoc')),
            },
            {
                path: 'reoder-array',
                label: 'چیدمان مجدد آرایه',
                component: lazy(() => import('./components/ReoderArrayDoc')),
            },
            {
                path: 'reorder dragable',
                label: 'چیدمان مجدد قابل کشیدن',
                component: lazy(
                    () => import('./components/ReorderDragableDoc'),
                ),
            },
            {
                path: 'sleep',
                label: 'خواب',
                component: lazy(() => import('./components/SleepDoc')),
            },
            {
                path: 'sort-by',
                label: 'مرتب‌سازی بر اساس',
                component: lazy(() => import('./components/SortByDoc')),
            },
            {
                path: 'wild-card-search',
                label: 'جستجوی کاراکترهای wildcard',
                component: lazy(() => import('./components/WildCardSearchDoc')),
            },
        ],
    },
    {
        groupName: 'کامپوننت سطح بالا',
        nav: [
            {
                path: 'with-header-item',
                label: 'با آیتم هدر',
                component: lazy(() => import('./components/WithHeaderItemDoc')),
            },
        ],
    },
]

export default utilsDocRoutes
