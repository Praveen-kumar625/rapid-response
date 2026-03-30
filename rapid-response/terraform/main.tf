provider "aws" {
  region = var.aws_region
}

# ---------- VPC ----------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.0"

  name = "${var.project_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
  single_nat_gateway  = true
}

# ---------- RDS (Aurora Serverless) ----------
module "aurora" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "7.5.0"

  name               = "${var.project_name}-db"
  engine             = "aurora-postgresql"
  engine_mode        = "serverless"
  engine_version     = "13.6"
  master_username    = var.db_username
  master_password    = var.db_password
  database_name      = "crisis"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.private_subnets
  scaling_configuration = {
    auto_pause               = true
    max_capacity            = 2
    min_capacity            = 0.5
    seconds_until_auto_pause = 300
  }
}

# ---------- Elasticache Redis ----------
module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "5.2.0"

  name               = "${var.project_name}-redis"
  engine             = "redis"
  engine_version     = "7.x"
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
  subnet_group_name  = module.vpc.private_subnets[0]
  vpc_id             = module.vpc.vpc_id
  security_group_ids = [aws_security_group.redis_sg.id]
}

resource "aws_security_group" "redis_sg" {
  name   = "${var.project_name}-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------- ECS Cluster ----------
resource "aws_ecs_cluster" "cluster" {
  name = "${var.project_name}-cluster"
}

# ---------- IAM Role for ECS Tasks ----------
data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_role" {
  name               = "${var.project_name}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---------- Log Group ----------
resource "aws_cloudwatch_log_group" "ecs" {
  name = "/aws/ecs/${var.project_name}"
  retention_in_days = 14
}

# ---------- Task Definitions (API, Worker, Web) ----------
locals {
  common_container_definitions = [
    {
      name      = "awslogs"
      image     = "amazon/aws-for-fluent-bit:latest"
      essential = false
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ]
}

# API task
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 3000, protocol = "tcp" }]
      environment = [
        { name = "DB_HOST", value = module.aurora.cluster_endpoint }
        { name = "DB_PORT", value = "5432" }
        { name = "DB_USER", value = var.db_username }
        { name = "DB_PASS", value = var.db_password }
        { name = "DB_NAME", value = "crisis" }
        { name = "REDIS_HOST", value = module.redis.primary_endpoint_address }
        { name = "REDIS_PORT", value = "6379" }
        { name = "AUTH0_DOMAIN", value = var.auth0_domain }
        { name = "AUTH0_AUDIENCE", value = var.auth0_audience }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])
}

# Worker task (similar but no port)
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project_name}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${aws_ecr_repository.worker.repository_url}:latest"
      essential = true
      environment = [
        { name = "REDIS_HOST", value = module.redis.primary_endpoint_address }
        { name = "REDIS_PORT", value = "6379" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    }
  ])
}

# Web task
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "web"
      image     = "${aws_ecr_repository.web.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 3000, protocol = "tcp" }]
      environment = [
        { name = "NEXT_PUBLIC_API_URL", value = "http://${aws_lb.api.dns_name}" }
        { name = "NEXT_PUBLIC_WS_URL", value = "ws://${aws_lb.api.dns_name}" }
        { name = "NEXT_PUBLIC_MAPBOX_TOKEN", value = var.mapbox_token }
        { name = "AUTH0_DOMAIN", value = var.auth0_domain }
        { name = "AUTH0_AUDIENCE", value = var.auth0_audience }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }
    }
  ])
}

# ---------- Application Load Balancer ----------
resource "aws_lb" "api" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb_sg.id]
}

resource "aws_security_group" "alb_sg" {
  name   = "${var.project_name}-alb-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Target groups & listeners for API (port 3000)
resource "aws_lb_target_group" "api_tg" {
  name        = "${var.project_name}-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"
  health_check {
    path                = "/healthz"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-299"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# ---------- ECS Service ----------
resource "aws_ecs_service" "api_svc" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = "api"
    container_port   = 3000
  }
  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "worker_svc" {
  name            = "${var.project_name}-worker"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "web_svc" {
  name            = "${var.project_name}-web"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = "web"
    container_port   = 3000
  }
  depends_on = [aws_lb_listener.http]
}

resource "aws_security_group" "ecs_sg" {
  name   = "${var.project_name}-ecs-sg"
  vpc_id = module.vpc.vpc_id

  # Allow inbound from ALB
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
