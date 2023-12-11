setuptools.setup(
    name="streamlit_echarts_lihaowei",
    version="0.1.0",
    author="lihaowei",
    author_email="646300129@qq.com",
    description="Echarts custom component for Streamlit,fork from andfanilo/streamlit-echarts",
    long_description=readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/andfanilo/streamlit-echarts",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[],
    python_requires=">=3.6",
    install_requires=[
        "streamlit >= 0.63",
        "simplejson >= 3.0",
        "pyecharts >= 1.9",
    ]
)