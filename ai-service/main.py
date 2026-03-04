import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def calculate_risk_level(features: dict) -> str:
    """
    Dummy/Mock ML function for predicting risk level based on features.
    """
    attendance = features.get('attendance', 0.0)
    averageGrade = features.get('averageGrade', 0.0)
    behaviorScore = features.get('behaviorScore', 0.0)
    homeworkCompletion = features.get('homeworkCompletion', 0.0)

    # Simple rule-based mock implementation
    composite_score = (
        (attendance * 0.3) +
        (averageGrade * 0.4) +
        (behaviorScore * 0.2) +
        (homeworkCompletion * 0.1)
    )

    if composite_score >= 80:
        return "LOW"
    elif 60 <= composite_score < 80:
        return "MEDIUM"
    else:
        return "HIGH"

def get_recommendation(risk_level: str) -> str:
    if risk_level == "LOW":
        return "Keep up the good work. Suggest advanced enrichment programs."
    elif risk_level == "MEDIUM":
        return "Student may require some guidance. Recommend weekly check-ins and tutoring."
    else: # HIGH
        return "Immediate intervention required. Schedule a parent-teacher meeting and create a personalized support plan."


class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/predict':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                features = json.loads(post_data.decode('utf-8'))
                logging.info(f"Received prediction request: {features}")
                
                risk_level = calculate_risk_level(features)
                recommendation = get_recommendation(risk_level)
                
                response_data = {
                    "riskLevel": risk_level,
                    "recommendation": recommendation
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                logging.info(f"Sent prediction response: {response_data}")
                
            except Exception as e:
                logging.error(f"Error processing request: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"detail": str(e)}
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = ThreadedHTTPServer(server_address, RequestHandler)
    logging.info(f"AI Student Risk Engine Microservice running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info("Server stopped.")
