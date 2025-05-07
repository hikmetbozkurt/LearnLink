# Deployment Instructions

1. **Prepare for deployment**:
   - Make sure you have all the required files:
     - `.ebextensions/01-healthcheck.config`
     - `.ebextensions/nginx-headers.config`
     - `.ebextensions/env-vars.config`
     - `.platform/nginx/conf.d/proxy.conf`
     - `Procfile`
   
2. **Create a zip file**:
   - Exclude the `node_modules` directory
   - Include all other files
   
3. **Deploy to Elastic Beanstalk**:
   - Upload the zip file to your EB environment
   - The application will use port 8081 internally
   - Health checks will be performed on the root path "/"
   
4. **After deployment**:
   - Check the environment health
   - Check the target group health in EC2
   - View logs if there are any issues
   
5. **If you still have issues**:
   - Check the nginx logs in the EC2 instance
   - SSH into the instance and check the application logs
   - Verify environment variables are properly set

## Common Issues

1. **400 Bad Request - Request Header Or Cookie Too Large**:
   - This is usually an nginx config issue; the current configuration should handle it.
   
2. **Severe - Following services are not running: web.**:
   - Check application logs for startup errors
   - Verify environment variables are set correctly
   - Check for database connection issues
   
3. **Unhealthy target group**:
   - Make sure health check is configured correctly
   - Check that the application responds to the health check path 