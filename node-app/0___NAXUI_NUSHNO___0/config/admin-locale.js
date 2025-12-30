export const adminLocale = {
    language: 'ru',
    supportedLngs: ['en', 'ru'],
    fallbackLng: 'en',
    resources: { // <-- раньше было "translations"
      en: {
        translation: {
          labels: {
            sites: 'Sites',
            darkdb: 'Database',
            fonts_fonts: 'Fonts',
            fonts_variants: 'Font Variants',
            fonts_subsets: 'Font Subsets',
            fonts_variant_subsets: 'Variant Subsets',
            ux_shop_categories: 'Shop Categories',
            ux_shop_products: 'Shop Products',
          },
          pages: {
            Fonts: 'Fonts',
            TestPage: 'Test Page',
          },
          buttons: {
            logout: 'Logout',
          },
          components: {
            LanguageSelector: {
              availableLanguages: {
                en: 'English',
                ru: 'Russian',
              }
            }
          }
        },
      },
      ru: {
        translation: {
          labels: {
            sites: 'Сайты',
            darkdb: 'База данных',
            fonts_fonts: 'Шрифты',
            fonts_variants: 'Варианты шрифтов',
            fonts_subsets: 'Подмножества шрифтов',
            fonts_variant_subsets: 'Подмножества вариантов',
            ux_shop_categories: 'Категории магазина',
            ux_shop_products: 'Продукты магазина',
          },
          pages: {
            Fonts: 'Шрифты',
            TestPage: 'Тестовая страница',
          },
          buttons: {
            logout: 'Выйти',
          },
          components: {
            LanguageSelector: {
              availableLanguages: {
                ru: 'Русский',
              }
            }
          }
        },
      }
    }
  }