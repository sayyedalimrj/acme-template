import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const othersNavigationConfig: NavigationTree[] = [
    {
        key: 'others',
        path: '',
        title: 'سایر',
        translateKey: 'nav.others.others',
        icon: 'others',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        subMenu: [
            {
                key: 'others.accessDenied',
                path: `/access-denied`,
                title: 'دسترسی ممنوع',
                translateKey: 'nav.others.accessDenied',
                icon: 'accessDenied',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.others.accessDeniedDesc',
                        label: 'صفحه دسترسی ممنوع',
                    },
                },
                subMenu: [],
            },
            {
                key: 'others.landing',
                path: `/landing`,
                title: 'لندینگ',
                translateKey: 'nav.others.landing',
                icon: 'landing',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.others.landingDesc',
                        label: 'استفاده از کامپوننت مشترک',
                    },
                },
                subMenu: [],
            },
        ],
    },
]

export default othersNavigationConfig
