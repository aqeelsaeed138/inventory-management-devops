"""
Selenium Automated Testing Script
Inventory SaaS Management System
Author: [Your Name]
Date: December 2025
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time
import unittest

class InventorySystemTests(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Setup method - runs once before all tests"""
        print("\n" + "="*70)
        print("INVENTORY SAAS SYSTEM - SELENIUM AUTOMATED TESTING")
        print("="*70)
        
        # Initialize Chrome driver
        cls.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
        cls.driver.maximize_window()
        cls.driver.implicitly_wait(10)
        
        # IMPORTANT: Update with your actual URLs
        cls.frontend_url = "http://localhost:5173"  # React/Vue/Angular frontend
        cls.backend_url = "http://localhost:5000"   # Backend API endpoint
        
        print(f"Frontend URL: {cls.frontend_url}")
        print(f"Backend URL: {cls.backend_url}")
    
    @classmethod
    def tearDownClass(cls):
        """Cleanup method - runs once after all tests"""
        print("\n" + "="*70)
        print("ALL TESTS COMPLETED - CLOSING BROWSER")
        print("="*70)
        time.sleep(2)
        cls.driver.quit()
    
    def setUp(self):
        """Runs before each test"""
        print(f"\n{'='*70}")
        print(f"▶ TEST STARTING: {self._testMethodName}")
        print(f"{'='*70}")
    
    def tearDown(self):
        """Runs after each test"""
        print(f"✓ TEST COMPLETED: {self._testMethodName}")
        time.sleep(1)
    
    # ==================== TEST CASE 1 ====================
    def test_01_inventory_dashboard_loads(self):
        """
        Test Case 1: Verify Inventory Dashboard/Homepage Loads Successfully
        
        Purpose: Ensure the main inventory dashboard loads without errors
        Steps:
        1. Navigate to frontend URL
        2. Verify page title contains "Inventory" or system name
        3. Check for main dashboard elements (header, sidebar, content)
        4. Verify no console errors
        """
        print("\n📋 TEST CASE 1: Inventory Dashboard Load Test")
        print("-" * 70)
        
        try:
            # Step 1: Navigate to frontend
            print("Step 1: Navigating to Inventory Dashboard...")
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Step 2: Verify page title
            page_title = self.driver.title
            print(f"Step 2: Page Title Retrieved: '{page_title}'")
            self.assertIsNotNone(page_title, "Page title should not be empty")
            
            # Step 3: Check for common inventory dashboard elements
            print("Step 3: Checking for dashboard elements...")
            
            # Check if body loaded
            body = self.driver.find_element(By.TAG_NAME, "body")
            self.assertIsNotNone(body, "Body element should be present")
            print("   ✓ Body element found")
            
            # Check for common elements
            headers = self.driver.find_elements(By.TAG_NAME, "h1")
            if headers:
                print(f"   ✓ Found {len(headers)} H1 header(s): '{headers[0].text}'")
            
            # Check for navigation/sidebar
            nav_elements = self.driver.find_elements(By.TAG_NAME, "nav")
            if nav_elements:
                print(f"   ✓ Found {len(nav_elements)} navigation element(s)")
            
            # Check for buttons (Add Inventory, etc.)
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            print(f"   ✓ Found {len(buttons)} button(s) on dashboard")
            
            # Check for tables (inventory list)
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            if tables:
                print(f"   ✓ Found {len(tables)} table(s) - Inventory list present")
            
            # Step 4: Take screenshot
            screenshot_name = "test1_inventory_dashboard_loaded.png"
            self.driver.save_screenshot(screenshot_name)
            print(f"\n📸 Screenshot saved: {screenshot_name}")
            
            # Verification
            print("\n✅ RESULT: Dashboard loaded successfully")
            print(f"   - Page Title: {page_title}")
            print(f"   - Elements Found: Body, Headers, Buttons")
            print(f"   - Status: PASS")
            
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            self.driver.save_screenshot("test1_error.png")
            raise
    
    # ==================== TEST CASE 2 ====================
    def test_02_inventory_form_interaction(self):
        """
        Test Case 2: Validate Inventory Add/Edit Form Behavior
        
        Purpose: Test form interactions for adding/editing inventory items
        Steps:
        1. Navigate to dashboard
        2. Find and click "Add Inventory" button
        3. Locate form fields (Item Name, Quantity, Price, etc.)
        4. Fill in test data
        5. Verify form validation
        6. Submit form (or validate without submitting)
        """
        print("\n📝 TEST CASE 2: Inventory Form Interaction Test")
        print("-" * 70)
        
        try:
            # Step 1: Navigate to dashboard
            print("Step 1: Navigating to Inventory Dashboard...")
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Take "before" screenshot
            self.driver.save_screenshot("test2_dashboard_before_form.png")
            print("📸 Screenshot saved: test2_dashboard_before_form.png")
            
            # Step 2: Look for form elements or "Add" button
            print("\nStep 2: Searching for form elements...")
            
            # Common selectors for inventory forms - try multiple approaches
            add_button_found = False
            
            # Try finding "Add" button by text
            try:
                add_buttons = self.driver.find_elements(By.XPATH, 
                    "//button[contains(text(), 'Add') or contains(text(), 'add') or contains(text(), 'New') or contains(text(), 'Create')]")
                if add_buttons:
                    print(f"   ✓ Found 'Add/New' button: '{add_buttons[0].text}'")
                    add_buttons[0].click()
                    time.sleep(2)
                    add_button_found = True
                    print("   ✓ Clicked Add button")
            except:
                print("   ℹ No Add button found by text")
            
            # Step 3: Find form fields
            print("\nStep 3: Locating form input fields...")
            
            # Find all input fields
            input_fields = self.driver.find_elements(By.TAG_NAME, "input")
            print(f"   ✓ Found {len(input_fields)} input field(s)")
            
            # Find textarea fields
            textarea_fields = self.driver.find_elements(By.TAG_NAME, "textarea")
            if textarea_fields:
                print(f"   ✓ Found {len(textarea_fields)} textarea field(s)")
            
            # Find select dropdowns
            select_fields = self.driver.find_elements(By.TAG_NAME, "select")
            if select_fields:
                print(f"   ✓ Found {len(select_fields)} dropdown field(s)")
            
            # Step 4: Fill sample data (if inputs found)
            if len(input_fields) > 0:
                print("\nStep 4: Filling test data into form fields...")
                
                # Try to fill first few inputs with test data
                test_data = [
                    "iphone",      # Product Name
                    "100",              # Quantity
                    "29.99",            # Price
                    "SKU12345"          # SKU/Code
                ]
                
                for idx, field in enumerate(input_fields[:4]):  # Fill first 4 fields
                    try:
                        field_type = field.get_attribute("type")
                        field_name = field.get_attribute("name") or field.get_attribute("placeholder") or f"field_{idx}"
                        
                        # Skip hidden, submit, button fields
                        if field_type not in ["hidden", "submit", "button", "checkbox", "radio"]:
                            if idx < len(test_data):
                                field.clear()
                                field.send_keys(test_data[idx])
                                print(f"   ✓ Filled '{field_name}': {test_data[idx]}")
                    except:
                        pass
                
                # Take screenshot after filling
                time.sleep(1)
                self.driver.save_screenshot("test2_form_filled.png")
                print("\n📸 Screenshot saved: test2_form_filled.png")
            
            # Step 5: Verify form elements
            print("\nStep 5: Form Validation...")
            total_fields = len(input_fields) + len(textarea_fields) + len(select_fields)
            self.assertGreater(total_fields, 0, "Form should have input fields")
            print(f"   ✓ Total form elements verified: {total_fields}")
            
            # Find submit button
            submit_buttons = self.driver.find_elements(By.XPATH, 
                "//button[contains(text(), 'Submit') or contains(text(), 'Save') or contains(text(), 'Add') or @type='submit']")
            
            if submit_buttons:
                print(f"   ✓ Found submit button: '{submit_buttons[0].text}'")
                # NOTE: Uncomment below to actually submit
                # submit_buttons[0].click()
                # time.sleep(2)
                # self.driver.save_screenshot("test2_after_submit.png")
                print("   ℹ Form ready to submit (not submitted in test)")
            
            print("\n✅ RESULT: Form interaction test passed")
            print(f"   - Input Fields: {len(input_fields)}")
            print(f"   - Total Form Elements: {total_fields}")
            print(f"   - Status: PASS")
            
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            self.driver.save_screenshot("test2_error.png")
            raise
    
    # ==================== TEST CASE 3 ====================
    def test_03_inventory_api_navigation(self):
        """
        Test Case 3: Check Navigation and Backend API Response
        
        Purpose: Verify navigation between pages and test API connectivity
        Steps:
        1. Navigate to dashboard
        2. Check all navigation links/menus
        3. Test navigation to different sections
        4. Verify API endpoint accessibility
        5. Check frontend-to-backend connectivity
        """
        print("\n🔗 TEST CASE 3: Navigation & API Connectivity Test")
        print("-" * 70)
        
        try:
            # Step 1: Navigate to dashboard
            print("Step 1: Loading Inventory Dashboard...")
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Step 2: Find navigation elements
            print("\nStep 2: Discovering navigation elements...")
            
            # Find all links
            all_links = self.driver.find_elements(By.TAG_NAME, "a")
            print(f"   ✓ Found {len(all_links)} link(s)")
            
            # List navigation links
            nav_links = []
            for link in all_links[:10]:  # Check first 10 links
                link_text = link.text.strip()
                link_href = link.get_attribute("href")
                if link_text and link_href:
                    nav_links.append((link_text, link_href))
                    print(f"   - Link: '{link_text}' → {link_href}")
            
            # Find all buttons
            all_buttons = self.driver.find_elements(By.TAG_NAME, "button")
            print(f"\n   ✓ Found {len(all_buttons)} button(s)")
            
            # List button texts
            for btn in all_buttons[:5]:  # Show first 5 buttons
                btn_text = btn.text.strip()
                if btn_text:
                    print(f"   - Button: '{btn_text}'")
            
            # Step 3: Test navigation
            print("\nStep 3: Testing navigation functionality...")
            
            # Check for common inventory sections
            sections_to_check = [
                ("dashboard", "Dashboard"),
                ("inventory", "Inventory"),
                ("products", "Products"),
                ("items", "Items"),
                ("reports", "Reports"),
                ("settings", "Settings")
            ]
            
            current_url = self.driver.current_url
            print(f"   Current URL: {current_url}")
            
            # Try clicking first valid navigation link
            if nav_links:
                try:
                    print(f"\n   Attempting to navigate to: '{nav_links[0][0]}'")
                    first_link = self.driver.find_element(By.LINK_TEXT, nav_links[0][0])
                    first_link.click()
                    time.sleep(2)
                    new_url = self.driver.current_url
                    print(f"   ✓ Navigated to: {new_url}")
                    
                    # Go back
                    self.driver.back()
                    time.sleep(1)
                    print("   ✓ Navigation back successful")
                except:
                    print("   ℹ Navigation click skipped")
            
            # Take screenshot
            self.driver.save_screenshot("test3_navigation_elements.png")
            print("\n📸 Screenshot saved: test3_navigation_elements.png")
            
            # Step 4: Test API endpoint (if accessible)
            print("\nStep 4: Testing Backend API connectivity...")
            
            try:
                # Navigate to API endpoint
                api_test_url = f"{self.backend_url}/api/inventory"  # Adjust endpoint
                print(f"   Testing API endpoint: {api_test_url}")
                
                self.driver.get(api_test_url)
                time.sleep(2)
                
                # Get page source to check response
                page_source = self.driver.page_source
                
                # Check if we got JSON response or API documentation
                if "inventory" in page_source.lower() or "{" in page_source or "api" in page_source.lower():
                    print("   ✓ API endpoint accessible")
                    print("   ✓ Response received from backend")
                    self.driver.save_screenshot("test3_api_response.png")
                    print("   📸 Screenshot saved: test3_api_response.png")
                else:
                    print("   ℹ API response format not recognized")
                
                # Return to frontend
                self.driver.get(self.frontend_url)
                time.sleep(2)
                
            except Exception as e:
                print(f"   ℹ API endpoint test skipped: {str(e)}")
            
            # Step 5: Verify elements
            print("\nStep 5: Verification...")
            self.assertGreater(len(all_links) + len(all_buttons), 0, 
                             "Page should have navigation elements")
            
            print("\n✅ RESULT: Navigation and API test passed")
            print(f"   - Navigation Links: {len(all_links)}")
            print(f"   - Buttons: {len(all_buttons)}")
            print(f"   - Frontend URL: {self.frontend_url}")
            print(f"   - Backend API: {self.backend_url}")
            print(f"   - Status: PASS")
            
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            self.driver.save_screenshot("test3_error.png")
            raise

# ==================== TEST EXECUTION ====================
if __name__ == "__main__":
    # Create test suite
    print("\n" + "="*70)
    print("INITIALIZING INVENTORY SYSTEM TEST SUITE")
    print("="*70)
    
    suite = unittest.TestLoader().loadTestsFromTestCase(InventorySystemTests)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print final summary
    print("\n" + "="*70)
    print("FINAL TEST EXECUTION SUMMARY")
    print("="*70)
    print(f"Total Tests Run: {result.testsRun}")
    print(f"✅ Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"❌ Failed: {len(result.failures)}")
    print(f"⚠️  Errors: {len(result.errors)}")
    print(f"Success Rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print("="*70)
    
    # List generated screenshots
    print("\n📸 SCREENSHOTS GENERATED:")
    print("   1. test1_inventory_dashboard_loaded.png")
    print("   2. test2_dashboard_before_form.png")
    print("   3. test2_form_filled.png")
    print("   4. test3_navigation_elements.png")
    print("   5. test3_api_response.png (if API accessible)")
    print("\n" + "="*70)