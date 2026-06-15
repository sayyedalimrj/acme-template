import { GUIDE_PREFIX_PATH } from '@/constants/route.constant'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const guideNavigationConfig: NavigationTree[] = [
    {
        key: 'guide',
        path: '',
        title: 'راهنما',
        translateKey: 'nav.guide.guide',
        icon: 'guide',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        subMenu: [
            {
                key: 'guide.documentation',
                path: `${GUIDE_PREFIX_PATH}/documentation/introduction`,
                title: 'مستندات',
                translateKey: 'nav.guide.documentation',
                icon: 'documentation',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.guide.documentationDesc',
                        label: 'راهنمای قالب عمومی',
                    },
                },
                subMenu: [],
            },
            {
                key: 'guide.sharedComponentDoc',
                path: `${GUIDE_PREFIX_PATH}/shared-component-doc/abbreviate-number`,
                title: 'کامپوننت مشترک',
                translateKey: 'nav.guide.sharedComponentDoc',
                icon: 'sharedComponentDoc',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.guide.sharedComponentDocDesc',
                        label: 'استفاده از کامپوننت مشترک',
                    },
                },
                subMenu: [],
            },
            {
                key: 'guide.utilsDoc',
                path: `${GUIDE_PREFIX_PATH}/utils-doc/use-auth`,
                title: 'ابزارها',
                translateKey: 'nav.guide.utilsDoc',
                icon: 'utilsDoc',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.guide.utilsDocDesc',
                        label: 'مستندات درباره توابع ابزارها',
                    },
                },
                subMenu: [],
            },
            {
                key: 'guide.changeLog',
                path: `${GUIDE_PREFIX_PATH}/changelog`,
                title: 'تغییرات نسخه',
                translateKey: 'nav.guide.changeLog',
                icon: 'changeLog',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.guide.changeLogDesc',
                        label: 'تمام سوابق نسخه‌ها',
                    },
                },
                subMenu: [],
            },
        ],
    },
]


export default guideNavigationConfig
