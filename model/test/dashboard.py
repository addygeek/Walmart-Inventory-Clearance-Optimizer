# mongo_dashboard.py
import pymongo
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from collections import Counter
from dotenv import load_dotenv


# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

class WalmartClearanceDashboard:
    def __init__(self, mongo_uri="mongodb://localhost:27017/"):
        """Initialize MongoDB connection"""
        try:
            self.client = pymongo.MongoClient(mongo_uri)
            self.db = self.client["walmart_clearance"]
            self.products_collection = self.db["products"]
            self.interactions_collection = self.db["interactions"]
            
            # Test connection
            self.client.admin.command('ping')
            print("✅ Connected to MongoDB successfully!")
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            self.client = None
    
    def fetch_all_products(self):
        """Fetch all product details from MongoDB"""
        try:
            if not self.client:
                print("❌ No database connection")
                return pd.DataFrame()
            
            # Fetch all products
            products = list(self.products_collection.find({}))
            
            if not products:
                print("⚠️ No products found in database")
                return pd.DataFrame()
            
            # Convert to DataFrame
            products_df = pd.DataFrame(products)
            
            # Clean and process data
            if 'expiryDate' in products_df.columns:
                products_df['expiryDate'] = pd.to_datetime(products_df['expiryDate'])
                
            print(f"📦 Fetched {len(products_df)} products from database")
            return products_df
            
        except Exception as e:
            print(f"❌ Error fetching products: {e}")
            return pd.DataFrame()
    
    def calculate_statistics(self, products_df):
        """Calculate comprehensive statistics"""
        if products_df.empty:
            return {}
        
        try:
            # Basic statistics
            total_products = len(products_df)
            total_stock = products_df['stock'].sum()
            total_value = (products_df['price'] * products_df['stock']).sum()
            total_discounted_value = (products_df['discounted_price'] * products_df['stock']).sum()
            potential_savings = total_value - total_discounted_value
            
            # Discount statistics
            products_with_discount = products_df[products_df['discount'] > 0]
            average_discount = products_df['discount'].mean()
            max_discount = products_df['discount'].max()
            total_discounted_items = len(products_with_discount)
            
            # Urgency statistics
            average_urgency = products_df['urgency_score'].mean()
            critical_products = products_df[products_df['days_to_expiry'] <= 3]
            urgent_products = products_df[products_df['days_to_expiry'] <= 7]
            soon_expiry = products_df[products_df['days_to_expiry'] <= 14]
            
            # Stock statistics
            zero_stock = products_df[products_df['stock'] == 0]
            low_stock = products_df[products_df['stock'] < 10]
            medium_stock = products_df[(products_df['stock'] >= 10) & (products_df['stock'] < 50)]
            high_stock = products_df[products_df['stock'] >= 50]
            
            # Category statistics
            category_counts = products_df['category'].value_counts()
            category_values = products_df.groupby('category').apply(
                lambda x: (x['price'] * x['stock']).sum()
            ).sort_values(ascending=False)
            
            # Price statistics
            price_stats = {
                'min_price': products_df['price'].min(),
                'max_price': products_df['price'].max(),
                'avg_price': products_df['price'].mean(),
                'median_price': products_df['price'].median()
            }
            
            # Expiry analysis
            expiry_analysis = {
                'expired': len(products_df[products_df['days_to_expiry'] < 0]),
                'critical_1_3_days': len(critical_products),
                'urgent_4_7_days': len(urgent_products) - len(critical_products),
                'soon_8_14_days': len(soon_expiry) - len(urgent_products),
                'normal_15_plus_days': total_products - len(soon_expiry)
            }
            
            # Top products by value
            products_df['total_value'] = products_df['price'] * products_df['stock']
            top_value_products = products_df.nlargest(5, 'total_value')[['name', 'category', 'total_value']]
            
            # Most urgent products
            most_urgent = products_df.nsmallest(5, 'days_to_expiry')[['name', 'category', 'days_to_expiry', 'urgency_score']]
            
            return {
                'basic_stats': {
                    'total_products': total_products,
                    'total_stock': total_stock,
                    'total_value': total_value,
                    'total_discounted_value': total_discounted_value,
                    'potential_savings': potential_savings
                },
                'discount_stats': {
                    'total_discounted_items': total_discounted_items,
                    'average_discount': average_discount,
                    'max_discount': max_discount,
                    'discount_percentage': (total_discounted_items / total_products) * 100
                },
                'urgency_stats': {
                    'average_urgency': average_urgency,
                    'critical_count': len(critical_products),
                    'urgent_count': len(urgent_products),
                    'soon_expiry_count': len(soon_expiry)
                },
                'stock_stats': {
                    'zero_stock': len(zero_stock),
                    'low_stock': len(low_stock),
                    'medium_stock': len(medium_stock),
                    'high_stock': len(high_stock)
                },
                'category_stats': {
                    'category_counts': category_counts,
                    'category_values': category_values
                },
                'price_stats': price_stats,
                'expiry_analysis': expiry_analysis,
                'top_value_products': top_value_products,
                'most_urgent_products': most_urgent
            }
            
        except Exception as e:
            print(f"❌ Error calculating statistics: {e}")
            return {}
    
    def print_dashboard(self, stats):
        """Print a comprehensive dashboard"""
        if not stats:
            print("❌ No statistics available")
            return
        
        print("\n" + "="*80)
        print("🏪 WALMART CLEARANCE OPTIMIZER - COMPREHENSIVE DASHBOARD")
        print("="*80)
        print(f"📅 Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # Basic Statistics
        basic = stats.get('basic_stats', {})
        print("\n📊 BASIC STATISTICS")
        print("-" * 50)
        print(f"Total Products:           {basic.get('total_products', 0):,}")
        print(f"Total Stock Units:        {basic.get('total_stock', 0):,}")
        print(f"Total Inventory Value:    ${basic.get('total_value', 0):,.2f}")
        print(f"Discounted Value:         ${basic.get('total_discounted_value', 0):,.2f}")
        print(f"Potential Savings:        ${basic.get('potential_savings', 0):,.2f}")
        
        # Discount Statistics
        discount = stats.get('discount_stats', {})
        print("\n💰 DISCOUNT ANALYSIS")
        print("-" * 50)
        print(f"Items with Discounts:     {discount.get('total_discounted_items', 0):,}")
        print(f"Discount Coverage:        {discount.get('discount_percentage', 0):.1f}%")
        print(f"Average Discount:         {discount.get('average_discount', 0)*100:.1f}%")
        print(f"Maximum Discount:         {discount.get('max_discount', 0)*100:.1f}%")
        
        # Urgency Statistics
        urgency = stats.get('urgency_stats', {})
        print("\n⚠️ URGENCY ANALYSIS")
        print("-" * 50)
        print(f"Critical Items (≤3 days): {urgency.get('critical_count', 0):,}")
        print(f"Urgent Items (≤7 days):   {urgency.get('urgent_count', 0):,}")
        print(f"Soon Expiry (≤14 days):   {urgency.get('soon_expiry_count', 0):,}")
        print(f"Average Urgency Score:    {urgency.get('average_urgency', 0):.2f}")
        
        # Stock Analysis
        stock = stats.get('stock_stats', {})
        print("\n📦 STOCK ANALYSIS")
        print("-" * 50)
        print(f"Out of Stock:             {stock.get('zero_stock', 0):,}")
        print(f"Low Stock (<10):          {stock.get('low_stock', 0):,}")
        print(f"Medium Stock (10-49):     {stock.get('medium_stock', 0):,}")
        print(f"High Stock (≥50):         {stock.get('high_stock', 0):,}")
        
        # Price Statistics
        price = stats.get('price_stats', {})
        print("\n💵 PRICE ANALYSIS")
        print("-" * 50)
        print(f"Minimum Price:            ${price.get('min_price', 0):.2f}")
        print(f"Maximum Price:            ${price.get('max_price', 0):.2f}")
        print(f"Average Price:            ${price.get('avg_price', 0):.2f}")
        print(f"Median Price:             ${price.get('median_price', 0):.2f}")
        
        # Expiry Breakdown
        expiry = stats.get('expiry_analysis', {})
        print("\n⏰ EXPIRY BREAKDOWN")
        print("-" * 50)
        print(f"Already Expired:          {expiry.get('expired', 0):,}")
        print(f"Critical (1-3 days):      {expiry.get('critical_1_3_days', 0):,}")
        print(f"Urgent (4-7 days):        {expiry.get('urgent_4_7_days', 0):,}")
        print(f"Soon (8-14 days):         {expiry.get('soon_8_14_days', 0):,}")
        print(f"Normal (15+ days):        {expiry.get('normal_15_plus_days', 0):,}")
        
        # Category Analysis
        category_stats = stats.get('category_stats', {})
        if 'category_counts' in category_stats:
            print("\n🏷️ CATEGORY BREAKDOWN")
            print("-" * 50)
            for category, count in category_stats['category_counts'].head(10).items():
                print(f"{category:<20} {count:>8,} items")
        
        # Top Value Products
        top_products = stats.get('top_value_products')
        if top_products is not None and not top_products.empty:
            print("\n💎 TOP VALUE PRODUCTS")
            print("-" * 50)
            for idx, row in top_products.iterrows():
                print(f"{row['name']:<30} ${row['total_value']:>10,.2f}")
        
        # Most Urgent Products
        urgent_products = stats.get('most_urgent_products')
        if urgent_products is not None and not urgent_products.empty:
            print("\n🚨 MOST URGENT PRODUCTS")
            print("-" * 50)
            for idx, row in urgent_products.iterrows():
                print(f"{row['name']:<30} {row['days_to_expiry']:>3} days ({row['urgency_score']:.2f})")
        
        print("\n" + "="*80)
        print("📋 DASHBOARD COMPLETE")
        print("="*80)
    
    def generate_recommendations(self, stats):
        """Generate actionable recommendations"""
        if not stats:
            return
        
        print("\n🎯 ACTIONABLE RECOMMENDATIONS")
        print("-" * 50)
        
        urgency = stats.get('urgency_stats', {})
        stock = stats.get('stock_stats', {})
        discount = stats.get('discount_stats', {})
        basic = stats.get('basic_stats', {})
        
        recommendations = []
        
        # Critical items
        if urgency.get('critical_count', 0) > 0:
            recommendations.append(f"🚨 URGENT: {urgency['critical_count']} items expire in ≤3 days - Apply maximum discounts!")
        
        # Urgent items
        if urgency.get('urgent_count', 0) > 0:
            recommendations.append(f"⚠️ HIGH: {urgency['urgent_count']} items expire in ≤7 days - Increase marketing efforts")
        
        # Stock issues
        if stock.get('zero_stock', 0) > 0:
            recommendations.append(f"📦 RESTOCK: {stock['zero_stock']} items are out of stock")
        
        if stock.get('low_stock', 0) > 0:
            recommendations.append(f"📉 LOW STOCK: {stock['low_stock']} items need restocking soon")
        
        # Discount opportunities
        total_products = basic.get('total_products', 0)
        non_discounted = total_products - discount.get('total_discounted_items', 0)
        if non_discounted > 0:
            recommendations.append(f"💰 OPPORTUNITY: {non_discounted} items could benefit from discounts")
        
        # Potential savings
        savings = basic.get('potential_savings', 0)
        if savings > 1000:
            recommendations.append(f"💵 SAVINGS: ${savings:,.2f} in potential customer savings available")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        if not recommendations:
            print("✅ All metrics look good! No immediate actions required.")
    
    def run_dashboard(self):
        """Run the complete dashboard"""
        print("🚀 Starting Walmart Clearance Optimizer Dashboard...")
        
        # Fetch products
        products_df = self.fetch_all_products()
        
        if products_df.empty:
            print("❌ No data available for dashboard")
            return
        
        # Calculate statistics
        stats = self.calculate_statistics(products_df)
        
        # Print dashboard
        self.print_dashboard(stats)
        
        # Generate recommendations
        self.generate_recommendations(stats)
        
        return stats

def main():
    """Main function to run the dashboard"""
 
    MONGO_URI = MONGODB_URI
    dashboard = WalmartClearanceDashboard(MONGO_URI)
    stats = dashboard.run_dashboard()
    if stats:
        import json
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"dashboard_stats_{timestamp}.json"
   
        serializable_stats = {}
        for key, value in stats.items():
            if isinstance(value, dict):
                serializable_stats[key] = {}
                for k, v in value.items():
                    if hasattr(v, 'to_dict'):
                        serializable_stats[key][k] = v.to_dict()
                    elif hasattr(v, 'tolist'):
                        serializable_stats[key][k] = v.tolist()
                    else:
                        serializable_stats[key][k] = str(v)
            else:
                serializable_stats[key] = str(value)
        
        try:
            with open(filename, 'w') as f:
                json.dump(serializable_stats, f, indent=2)
            print(f"\n💾 Stats saved to {filename}")
        except Exception as e:
            print(f"⚠️ Could not save stats: {e}")

if __name__ == "__main__":
    main()
