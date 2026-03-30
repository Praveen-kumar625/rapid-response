output "alb_dns_name" {
  value = aws_lb.api.dns_name
}
output "db_endpoint" {
  value = module.aurora.cluster_endpoint
}
output "redis_endpoint" {
  value = module.redis.primary_endpoint_address
}
