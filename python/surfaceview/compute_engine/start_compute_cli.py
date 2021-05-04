import click
from .start_compute_engine import start_compute_engine

@click.command('surfaceview-start-compute')
@click.option('--app-url', required=True, help="The URL of the web app")
@click.option('--label', required=True, help="A label for this compute engine")
def start_compute_cli(app_url: str, label: str):
    start_compute_engine(app_url=app_url, label=label)