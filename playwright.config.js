const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/e2e',fullyParallel:true,forbidOnly:!!process.env.CI,retries:0,
 use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:4173',trace:'retain-on-failure'},
 webServer:process.env.TEST_BASE_URL?undefined:{command:'node tools/serve.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
 projects:[{name:'desktop-chromium',use:{...devices['Desktop Chrome']}},{name:'mobile-chromium',use:{...devices['Pixel 7']}},{name:'tablet-webkit',use:{...devices['iPad (gen 7)']}}]
});
