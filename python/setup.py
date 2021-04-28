from setuptools import setup, find_packages

setup(
    packages=find_packages(),
    scripts=['bin/vtk-to-mesh-json'],
    install_requires=['vtk', 'click']
)