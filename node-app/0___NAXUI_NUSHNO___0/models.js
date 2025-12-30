import { sequelize, DataTypes } from '#import';

// Импорт всех таблиц
const Site = sequelize.define('Site', {
    name: DataTypes.STRING,
    folder: DataTypes.STRING,
    port: DataTypes.INTEGER,
    url: DataTypes.STRING,
    is_enable: DataTypes.BOOLEAN,
  }, 
  {
    tableName: 'sites',
    timestamps: false,
  }
);

const Font = sequelize.define('Font', {
    name: DataTypes.STRING,
  }, 
  {
    tableName: 'fonts_fonts',
    timestamps: false,
  }
);

const FontVariant = sequelize.define('FontVariant', {
    weight: DataTypes.INTEGER,
    italic: DataTypes.BOOLEAN,
    width: DataTypes.INTEGER,
    file: DataTypes.STRING,
    format: DataTypes.STRING,
    font_id: DataTypes.INTEGER,
  }, 
  {
    tableName: 'fonts_variants',
    timestamps: false,
  }
);

const FontSubset = sequelize.define('FontSubset', {
    name: DataTypes.STRING,
  }, 
  {
    tableName: 'fonts_subsets',
    timestamps: false,
  }
);

const FontVariantSubset = sequelize.define('FontVariantSubset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    variant_id: DataTypes.INTEGER,
    subset_id: DataTypes.INTEGER,
  }, 
  {
    tableName: 'fonts_variant_subsets',
    timestamps: false,
  }
);

const UxShopCategory = sequelize.define('UxShopCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_name: DataTypes.TEXT,
    category_image: DataTypes.TEXT,
  }, 
  {
    tableName: 'ux_shop_categories',
    timestamps: false,
  }
);

const UxShopProduct = sequelize.define('UxShopProduct', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.TEXT,
    description: DataTypes.TEXT,
    price: DataTypes.FLOAT,
    category_name: DataTypes.TEXT,
    image: DataTypes.TEXT,
  }, 
  {
    tableName: 'ux_shop_products',
    timestamps: false,
  }
);

const db2 = {
  sequelize,
  Site,
  Font,
  FontVariant,
  FontSubset,
  FontVariantSubset,
  UxShopCategory,
  UxShopProduct,
}; 

export { Site, db2 };