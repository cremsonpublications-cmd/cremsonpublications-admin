#!/usr/bin/env python3
import json
from datetime import datetime
from collections import defaultdict
import os

def analyze_orders():
    """Analyze orders from the JSON file and generate yearly report"""

    # Path to the orders file
    orders_file = "/Users/sketchbrahma/Documents/personal-belongs/cremsonpublication/orders.json"

    # Initialize data structures
    yearly_data = defaultdict(lambda: {
        'total_orders': 0,
        'total_amount': 0.0,
        'monthly_breakdown': defaultdict(lambda: {'orders': 0, 'amount': 0.0})
    })

    print("Reading and parsing orders.json...")

    try:
        with open(orders_file, 'r', encoding='utf-8') as file:
            orders = json.load(file)

        print(f"Found {len(orders)} orders to analyze...")

        for order in orders:
            try:
                # Extract date and total
                date_created = order.get('date_created', '')
                total = float(order.get('total', 0))

                if not date_created:
                    continue

                # Parse date (format: "2025-10-11T14:02:24")
                date_obj = datetime.fromisoformat(date_created.replace('Z', ''))
                year = date_obj.year
                month = date_obj.month
                month_name = date_obj.strftime('%B')  # Full month name

                # Only include years 2023, 2024, 2025
                if year in [2023, 2024, 2025]:
                    yearly_data[year]['total_orders'] += 1
                    yearly_data[year]['total_amount'] += total
                    yearly_data[year]['monthly_breakdown'][month_name]['orders'] += 1
                    yearly_data[year]['monthly_breakdown'][month_name]['amount'] += total

            except Exception as e:
                print(f"Error processing order {order.get('id', 'unknown')}: {e}")
                continue

        # Generate report
        report_lines = []
        report_lines.append("YEARLY ORDERS REPORT")
        report_lines.append("=" * 50)
        report_lines.append(f"Report generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("")

        # Summary for each year
        for year in sorted(yearly_data.keys()):
            data = yearly_data[year]
            report_lines.append(f"YEAR {year}")
            report_lines.append("-" * 20)
            report_lines.append(f"Total Orders: {data['total_orders']:,}")
            report_lines.append(f"Total Amount: ₹{data['total_amount']:,.2f}")
            report_lines.append("")

            # Monthly breakdown
            if data['monthly_breakdown']:
                report_lines.append(f"Monthly Breakdown for {year}:")

                # Sort months chronologically
                month_order = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December']

                for month_name in month_order:
                    if month_name in data['monthly_breakdown']:
                        month_data = data['monthly_breakdown'][month_name]
                        if month_data['orders'] > 0:  # Only show months with orders
                            report_lines.append(f"  {year} {month_name}: {month_data['orders']} orders, ₹{month_data['amount']:,.2f}")

                # Calculate averages
                months_with_orders = sum(1 for m in data['monthly_breakdown'].values() if m['orders'] > 0)
                if months_with_orders > 0:
                    avg_orders_per_month = data['total_orders'] / months_with_orders
                    avg_amount_per_month = data['total_amount'] / months_with_orders
                    report_lines.append(f"  Average per active month: {avg_orders_per_month:.1f} orders, ₹{avg_amount_per_month:,.2f}")

            report_lines.append("")
            report_lines.append("")

        # Overall summary
        total_orders_all_years = sum(data['total_orders'] for data in yearly_data.values())
        total_amount_all_years = sum(data['total_amount'] for data in yearly_data.values())

        report_lines.append("OVERALL SUMMARY (2023-2025)")
        report_lines.append("=" * 30)
        report_lines.append(f"Total Orders: {total_orders_all_years:,}")
        report_lines.append(f"Total Amount: ₹{total_amount_all_years:,.2f}")
        if total_orders_all_years > 0:
            avg_order_value = total_amount_all_years / total_orders_all_years
            report_lines.append(f"Average Order Value: ₹{avg_order_value:,.2f}")

        # Write report to file
        report_file = "/Users/sketchbrahma/Documents/personal-belongs/cremsonpublication/cremsonpublications-admin/yearly_orders_report.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))

        print(f"Report generated successfully: {report_file}")
        print("\nReport Summary:")
        for year in sorted(yearly_data.keys()):
            data = yearly_data[year]
            print(f"{year}: {data['total_orders']} orders, ₹{data['total_amount']:,.2f}")

        return report_file

    except FileNotFoundError:
        print(f"Error: Could not find orders file at {orders_file}")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in orders file")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    analyze_orders()